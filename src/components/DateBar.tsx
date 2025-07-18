import React, { useRef, useEffect } from 'react';
import { toZonedTime } from 'date-fns-tz';
import { isWeekend } from 'date-fns';
import { generateDateRange, groupByMonth, formatDateForDisplay } from '../utils/timeUtils';
import { Button } from "./ui/button";
import { Calendar, Moon, Sun } from 'lucide-react';
import { CustomDatePicker } from "./ui/custom-date-picker";
import { useDarkMode } from '../hooks/useDarkMode';

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
  const [pickerDate, setPickerDate] = React.useState<Date | undefined>(selectedDate);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

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

  const handleDateChange = (date: Date) => {
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
      <div className="flex-1 min-w-0 overflow-x-auto">
        <div className="flex gap-1 w-fit items-center min-w-[450px] xs:min-w-[500px] sm:min-w-[550px]">
          {/* Calendar icon cell as a clickable button */}
          <CustomDatePicker
            value={pickerDate}
            onSelect={(date) => {
              setPickerDate(date);
              handleDateChange(date);
            }}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center justify-center h-12 w-10 p-1 mt-3.5 text-center text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                aria-label="Open calendar"
              >
                <Calendar className="h-6 w-6" />
              </Button>
            }
          />
          {monthGroups.map((group) => {
            // Get the days for this month group
            const groupDays = days.slice(group.start, group.end + 1);
            return (
              <div
                key={group.month}
                className="flex flex-col items-center shrink-0 relative"
              >
                {/* Date cells for this month */}
                <div className="flex gap-1 mt-5">
                  {groupDays.map((day, idx) => {
                    const isSelected = isSameDateInHomeTimezone(day, selectedDate, homeTimezone);
                    const isTodayDate = isTodayInHomeTimezone(day, homeTimezone);
                    const isWeekendDay = isWeekend(day);
                    const { day: dayNumber, weekday } = formatDateForDisplay(day);

                    // Show the month label logic:
                    // 1. Always show for the middle date (index 4 in the 9-day range)
                    // 2. Show for first day of month if it's visible
                    // 3. Only show for month boundaries when month actually changes
                    const globalIdx = group.start + idx;
                    const isMiddleDate = globalIdx === 4; // Middle of 9-day range
                    const isFirstOfMonth = day.getDate() === 1;
                    
                    // Check if this is actually a month boundary by comparing with previous day
                    const prevDay = globalIdx > 0 ? days[globalIdx - 1] : null;
                    const isMonthBoundary = prevDay && 
                      (day.getMonth() !== prevDay.getMonth() || day.getFullYear() !== prevDay.getFullYear());
                    
                    const shouldShowMonthLabel = isMiddleDate || (isFirstOfMonth && isMonthBoundary);

                    return (
                      <div key={group.start + idx} className="relative">
                        {shouldShowMonthLabel && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-semibold text-primary bg-background px-1 rounded pointer-events-none select-none whitespace-nowrap z-10 border border-border">
                            {group.month}
                          </div>
                        )}
                        <Button
                          onClick={() => handleDayClick(day)}
                          ref={isSelected ? selectedDayRef : undefined}
                          variant={isSelected ? "default" : isTodayDate ? "outline" : "ghost"}
                          size="sm"
                          className={`
                            flex flex-col items-center justify-center h-12 w-10 p-1 text-center
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
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Action buttons */}
      <div className="shrink-0 mr-4 flex items-center gap-2">
        {/* Dark Mode Toggle */}
        <Button
          onClick={toggleDarkMode}
          variant="outline"
          size="sm"
          className="text-xs"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        
        {/* Share Link Button */}
        {onShareLink && (
          <Button
            onClick={onShareLink}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Share Link
          </Button>
        )}
      </div>
    </div>
  );
};
