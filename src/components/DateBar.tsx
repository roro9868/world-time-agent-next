import React, { useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { toZonedTime } from 'date-fns-tz';
import { isToday, isWeekend } from 'date-fns';
import { generateDateRange, groupByMonth, formatDateForDisplay } from '../utils/timeUtils';

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
    <div className="flex flex-col items-start space-y-0.5 max-w-sm">
      <div className="flex items-center space-x-1">
        {/* Calendar Icon with hidden native date input */}
        <label className="relative inline-block w-5 h-5 sm:w-6 sm:h-6 p-0 m-0 cursor-pointer">
          <Calendar className="block w-full h-full text-gray-500 hover:text-primary-600 cursor-pointer" />
          <input
            type="date"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer block"
            value={selectedDate.toISOString().slice(0, 10)}
            onChange={(e) => {
              // Fix off-by-one: use the value as local date, not UTC
              const val = e.target.value;
              if (val) {
                const [year, month, day] = val.split('-').map(Number);
                const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
                onDateChange(localDate);
              }
            }}
          />
        </label>
        {/* Month groups with underline and date cells */}
        <div className="inline-block align-top">
          <div className="flex w-max">
            {monthGroups.map((group, i) => {
              // Get the days for this month group
              const groupDays = days.slice(group.start, group.end + 1);
              return (
                <div
                  key={group.month}
                  className="flex flex-col items-center justify-end"
                  style={{
                    minWidth: `${groupDays.length * 28}px`,
                    marginRight: i === monthGroups.length - 1 ? 0 : '2px',
                  }}
                >
                  {/* Month label with underline */}
                  <div className="w-full border-b-2 border-black flex flex-col items-center mb-0.5">
                    <span className="text-xs sm:text-sm font-bold text-gray-900 select-none">
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
                        <button
                          key={group.start + idx}
                          onClick={() => handleDayClick(day)}
                          ref={isSelected ? selectedDayRef : undefined}
                          className={`flex flex-col items-center px-1 py-0.5 rounded transition-all duration-150${isLast ? '' : ' mr-0.5'}
                            ${isSelected ? 'bg-primary-500 text-white' : isTodayDate ? 'border border-primary-400 text-primary-700' : 'text-gray-700'}
                            ${isWeekendDay && !isSelected ? 'text-green-600' : ''}
                            hover:bg-primary-100`}
                        >
                          <span className="text-xs sm:text-sm font-bold leading-tight">
                            {dayNumber}
                          </span>
                          <span className="text-[8px] sm:text-[10px] font-normal leading-none">
                            {weekday}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Today Button */}
        <button
          className="ml-1 h-8 sm:h-10 px-2 sm:px-4 rounded-lg bg-primary-500 text-white font-bold text-xs sm:text-sm shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all duration-150 flex items-center justify-center"
          style={{ minWidth: '40px', minHeight: '32px' }}
          onClick={() => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            onDateChange(now);
          }}
        >
          Today
        </button>
      </div>
    </div>
  );
};
