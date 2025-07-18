import React, { useRef, useEffect } from 'react';
import { toZonedTime } from 'date-fns-tz';
import { isWeekend } from 'date-fns';
import { generateDateRange, groupByMonth, formatDateForDisplay } from '../utils/timeUtils';
import { Button } from "./ui/button";

interface DateBarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  homeTimezone: string;
  onShareLink?: () => void;
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

export const DateBar: React.FC<DateBarProps> = ({ selectedDate, onDateChange, homeTimezone, onShareLink }) => {
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
    <div className="flex items-center justify-between w-full gap-4">
      {/* Month groups with date cells */}
      <div className="flex-1 min-w-0 max-w-fit overflow-x-auto">
        <div className="flex gap-1 w-fit">
          {monthGroups.map((group) => {
            // Get the days for this month group
            const groupDays = days.slice(group.start, group.end + 1);
            return (
              <div
                key={group.month}
                className="flex flex-col items-center shrink-0"
              >
                {/* Month label */}
                <div className="w-full border-b border-border pb-1 mb-2">
                  <span className="text-xs font-medium text-muted-foreground select-none tracking-wide block text-center">
                    {group.month}
                  </span>
                </div>
                {/* Date cells for this month */}
                <div className="flex gap-1">
                  {groupDays.map((day, idx) => {
                    const isSelected = isSameDateInHomeTimezone(day, selectedDate, homeTimezone);
                    const isTodayDate = isTodayInHomeTimezone(day, homeTimezone);
                    const isWeekendDay = isWeekend(day);
                    const { day: dayNumber, weekday } = formatDateForDisplay(day);
                    return (
                      <Button
                        key={group.start + idx}
                        onClick={() => handleDayClick(day)}
                        ref={isSelected ? selectedDayRef : undefined}
                        variant={isSelected ? "default" : isTodayDate ? "outline" : "ghost"}
                        size="sm"
                        className={`
                          flex flex-col items-center justify-center h-14 w-10 p-1 text-center
                          ${isSelected 
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                            : isTodayDate 
                              ? 'border-primary text-primary hover:bg-primary/10' 
                              : 'hover:bg-accent hover:text-accent-foreground'
                          }
                          ${isWeekendDay && !isSelected && !isTodayDate ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' : ''}
                        `}
                      >
                        <span className="text-sm font-semibold leading-none">
                          {dayNumber}
                        </span>
                        <span className="text-[10px] font-medium leading-none mt-1 opacity-70">
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
      {/* Share Link Button */}
      {onShareLink && (
        <div className="shrink-0">
          <Button
            onClick={onShareLink}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Share Link
          </Button>
        </div>
      )}
    </div>
  );
};
