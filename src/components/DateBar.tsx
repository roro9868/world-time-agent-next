import React, { useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { toZonedTime } from 'date-fns-tz';
import { isToday, isWeekend } from 'date-fns';
import { generateDateRange, groupByMonth, formatDateForDisplay } from '../utils/timeUtils';
import { Button } from "./components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Calendar as ShadcnCalendar } from "./components/ui/calendar";

interface DateBarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  homeTimezone: string;
}

// Helper to get a Date object for midnight in the home timezone (timezone-aware, robust polyfill for zonedTimeToUtc)
function getHomeMidnightDate(date: Date, homeTimezone: string): Date {
  const zoned = toZonedTime(date, homeTimezone);
  const year = zoned.getFullYear();
  const month = zoned.getMonth();
  const day = zoned.getDate();
  const utcMidnight = new Date(Date.UTC(year, month, day, 0, 0, 0));
  const offsetMinutes = -toZonedTime(utcMidnight, homeTimezone).getTimezoneOffset();
  return new Date(utcMidnight.getTime() - offsetMinutes * 60 * 1000);
}

export const DateBar: React.FC<DateBarProps> = ({ selectedDate, onDateChange, homeTimezone }) => {
  const selectedDayRef = useRef<HTMLButtonElement>(null);

  // Calculate the start of the day in the home timezone (timezone-aware, robust)
  const startOfHomeDay = getHomeMidnightDate(selectedDate, homeTimezone);

  // Generate 9 days centered on the selected date (4 before + selected + 4 after)
  const centerDate = new Date(startOfHomeDay.getTime());
  const days = generateDateRange(new Date(centerDate.getTime() - 4 * 24 * 60 * 60 * 1000), 9);
  const monthGroups = groupByMonth(days);

  const handleDayClick = (date: Date) => {
    // Always set time to midnight in home timezone for the selected date
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    onDateChange(d);
  };

  // Robust scroll-into-view: double rAF, plus fallback retry if ref not ready
  useEffect(() => {
    let didScroll = false;
    function scrollToSelected() {
      if (selectedDayRef.current) {
        selectedDayRef.current.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
          inline: 'center',
        });
        didScroll = true;
      }
    }
    // Double rAF for layout
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToSelected();
        // Fallback: if not found, try again after a short delay
        if (!didScroll) {
          setTimeout(scrollToSelected, 50);
        }
      });
    });
    // Also, if selectedDate is not in days, do nothing (prevents ref mismatch)
    // (days is always recalculated with selectedDate in range, but this is a safety check)
  }, [selectedDate, days.length]);

  return (
    <div className="flex items-center space-x-3 w-full">
      {/* Calendar Popover with shadcn/ui styling */}
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" className="w-12 h-12 p-0 bg-white hover:bg-gray-100 focus:bg-gray-100 transition-all duration-200 border-none shadow-none outline-none [&_svg]:!size-8">
            <Calendar size={32} className="text-gray-700" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col items-center">
            <ShadcnCalendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
              captionLayout="dropdown"
              fromYear={2000}
              toYear={2100}
            />
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => onDateChange(new Date())}
            >
              Today
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {/* Month groups with underline and date cells */}
      <div className="flex-1 min-w-0">
        <div className="flex w-full overflow-x-auto scrollbar-hide">
          {monthGroups.map((group, i) => {
            // Get the days for this month group
            const groupDays = days.slice(group.start, group.end + 1);
            return (
              <div
                key={group.month}
                className="flex flex-col items-center justify-end flex-shrink-0"
                style={{
                  minWidth: `${groupDays.length * 32}px`,
                  marginRight: i === monthGroups.length - 1 ? 0 : '4px',
                }}
              >
                                  {/* Month label with underline */}
                  <div className="w-full border-b-2 border-gray-300 flex flex-col items-center mb-0.5">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 select-none tracking-wide">
                      {group.month}
                    </span>
                  </div>
                {/* Date cells for this month */}
                <div className="flex w-full">
                  {groupDays.map((day, idx) => {
                    const isSelected =
                      toZonedTime(day, homeTimezone).toDateString() ===
                      toZonedTime(selectedDate, homeTimezone).toDateString();
                    const isTodayDate = isToday(day);
                    const isWeekendDay = isWeekend(day);
                    const { day: dayNumber, weekday } = formatDateForDisplay(day);
                    const isLast = idx === groupDays.length - 1 && i === monthGroups.length - 1;
                    return (
                                              <Button
                          key={group.start + idx}
                          onClick={() => handleDayClick(day)}
                          ref={isSelected ? selectedDayRef : undefined}
                          variant={isSelected ? undefined : isTodayDate ? "outline" : "ghost"}
                          className={`flex flex-col items-center px-1 py-1 rounded-md transition-all duration-200 min-w-[28px] h-auto${isLast ? '' : ' mr-1'}
                            ${isSelected 
                              ? 'bg-blue-600 text-white font-semibold hover:bg-blue-700' 
                              : isTodayDate 
                                ? 'border-2 border-blue-400 text-blue-700 font-semibold hover:border-blue-500 bg-blue-50/50' 
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            }
                            ${isWeekendDay && !isSelected && !isTodayDate ? 'text-emerald-600 hover:text-emerald-700' : ''}
                          `}
                        >
                        <span className="text-xs sm:text-sm font-bold leading-tight">
                          {dayNumber}
                        </span>
                                                  <span className="text-[8px] sm:text-[10px] font-medium leading-none -mt-2">
                            {weekday}
                          </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
