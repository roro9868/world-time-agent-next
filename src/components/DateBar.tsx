import React, { useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { toZonedTime } from 'date-fns-tz';
import { isToday, isWeekend } from 'date-fns';
import { generateDateRange, groupByMonth, formatDateForDisplay } from '../utils/timeUtils';
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as ShadcnCalendar } from "./ui/calendar";

interface DateBarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  homeTimezone: string;
}

// Helper to get a Date object for midnight in the home timezone
function getHomeMidnightDate(date: Date, homeTimezone: string): Date {
  // Convert the date to the home timezone, then set to midnight
  const zonedDate = toZonedTime(date, homeTimezone);
  return new Date(zonedDate.getFullYear(), zonedDate.getMonth(), zonedDate.getDate());
}

// Helper to compare dates in home timezone context
function isSameDateInHomeTimezone(date1: Date, date2: Date, homeTimezone: string): boolean {
  const midnight1 = getHomeMidnightDate(date1, homeTimezone);
  const midnight2 = getHomeMidnightDate(date2, homeTimezone);
  return midnight1.getTime() === midnight2.getTime();
}

// Helper to check if a date is today in home timezone
function isTodayInHomeTimezone(date: Date, homeTimezone: string): boolean {
  const today = new Date();
  return isSameDateInHomeTimezone(date, today, homeTimezone);
}

export const DateBar: React.FC<DateBarProps> = ({ selectedDate, onDateChange, homeTimezone }) => {
  const selectedDayRef = useRef<HTMLButtonElement>(null);

  // Calculate the start of the day in the home timezone
  const startOfHomeDay = getHomeMidnightDate(selectedDate, homeTimezone);

  // Generate 9 days centered on the selected date (4 before + selected + 4 after)
  const centerDate = new Date(startOfHomeDay.getTime());
  const days = generateDateRange(new Date(centerDate.getTime() - 4 * 24 * 60 * 60 * 1000), 9, homeTimezone);
  const monthGroups = groupByMonth(days);

  const handleDayClick = (date: Date) => {
    // Create a date at midnight in the home timezone for the selected date
    const midnightInHomeTimezone = getHomeMidnightDate(date, homeTimezone);
    onDateChange(midnightInHomeTimezone);
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
              onSelect={(date) => {
                if (date) {
                  const midnightInHomeTimezone = getHomeMidnightDate(date, homeTimezone);
                  onDateChange(midnightInHomeTimezone);
                }
              }}
              initialFocus
              captionLayout="dropdown"
              fromYear={2000}
              toYear={2100}
            />
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                const todayMidnight = getHomeMidnightDate(new Date(), homeTimezone);
                onDateChange(todayMidnight);
              }}
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
                    const isSelected = isSameDateInHomeTimezone(day, selectedDate, homeTimezone);
                    const isTodayDate = isTodayInHomeTimezone(day, homeTimezone);
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
