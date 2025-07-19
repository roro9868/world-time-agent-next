import React, { useRef, useEffect } from 'react';
import { isWeekend } from 'date-fns';
import { groupByMonth, formatDateForDisplay } from '../utils/timeUtils';
import { Button } from "./ui/button";
import { Calendar, Moon, Sun } from 'lucide-react';
import { CustomDatePicker } from "./ui/custom-date-picker";
import { useDarkMode } from '../hooks/useDarkMode';

interface DateBarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onShareLink?: () => void;
  anchorDate?: Date; // Add anchor date prop to avoid timezone conversion issues
}

export const DateBar: React.FC<DateBarProps> = ({ 
  selectedDate, 
  onDateChange, 
  onShareLink, 
  anchorDate 
}) => {
  const selectedDayRef = useRef<HTMLButtonElement>(null);
  const [pickerDate, setPickerDate] = React.useState<Date | undefined>(selectedDate);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // Simplified: Use anchor date directly to derive the date range
  const { days } = React.useMemo(() => {
    if (!anchorDate) {
      throw new Error('DateBar requires anchorDate to be provided');
    }
    
    // anchorDate is already a local date, use it directly
    const baseDate = new Date(anchorDate);
    
    // Generate 9 days centered on the anchor date (4 before + center + 4 after)
    const days: Date[] = [];
    for (let i = -4; i <= 4; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    
    return { days };
  }, [anchorDate]);
  
  const monthGroups = groupByMonth(days);

  const handleDayClick = (date: Date) => {
    // Pass the date directly to the parent
    onDateChange(date);
  };

  const handleDateChange = (date: Date) => {
    // Pass the date directly to the parent
    onDateChange(date);
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
        <div className="flex gap-0.5 xs:gap-1 w-fit items-center min-w-[300px] xs:min-w-[400px] sm:min-w-[500px] relative">
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
                className="flex flex-col items-center justify-center h-8 xs:h-10 sm:h-12 w-6 xs:w-8 sm:w-10 p-0.5 xs:p-1 mt-2 xs:mt-3 sm:mt-3.5 text-center text-muted-foreground hover-accent cursor-pointer"
                aria-label="Open calendar"
              >
                <Calendar className="h-3 xs:h-4 sm:h-6 w-3 xs:w-4 sm:w-6" />
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
                <div className="flex gap-1 mt-3 xs:mt-2">
                  {groupDays.map((day, idx) => {
                    // Check if this day matches the selected date
                    const isSelected = selectedDate && 
                      day.getDate() === selectedDate.getDate() &&
                      day.getMonth() === selectedDate.getMonth() &&
                      day.getFullYear() === selectedDate.getFullYear();
                    
                    const isWeekendDay = isWeekend(day);
                    const { day: dayNumber, weekday } = formatDateForDisplay(day);

                    // Show the month label logic:
                    // 1. Always show for the middle date (index 4 in the 9-day range)
                    // 2. Show for last day of previous month (when next day is first of new month AND different month than middle)
                    // 3. Show for first day of month if different month than the middle
                    const globalIdx = group.start + idx;
                    const isMiddleDate = globalIdx === 4; // Middle of 9-day range
                    const middleDate = days[4];
                    
                    // Check if next day is first of a different month
                    const nextDay = globalIdx < days.length - 1 ? days[globalIdx + 1] : null;
                    const isLastDayOfMonth = nextDay && nextDay.getDate() === 1 && 
                      (day.getMonth() !== nextDay.getMonth() || day.getFullYear() !== nextDay.getFullYear());
                    
                    // Check if this day is first of a different month than the middle
                    const isFirstDayOfDifferentMonth = day.getDate() === 1 && 
                      (day.getMonth() !== middleDate.getMonth() || day.getFullYear() !== middleDate.getFullYear());
                    
                    // Show month label if it's the middle date OR it's the last day of a different month OR it's the first day of a different month
                    const shouldShowMonthLabel = isMiddleDate || 
                      (isLastDayOfMonth && day.getMonth() !== middleDate.getMonth()) || 
                      isFirstDayOfDifferentMonth;

                    return (
                      <div key={group.start + idx} className="relative">
                        {shouldShowMonthLabel && (
                          <div className="absolute -top-2 xs:-top-3 left-1/2 -translate-x-1/2 text-[8px] xs:text-[10px] sm:text-xs font-semibold text-foreground bg-card dark:bg-slate-800 px-0.5 xs:px-1 rounded pointer-events-none select-none whitespace-nowrap z-20 border border-border dark:border-slate-600 shadow-sm">
                            {group.month}
                          </div>
                        )}
                        <Button
                          onClick={() => handleDayClick(day)}
                          ref={isSelected ? selectedDayRef : undefined}
                          variant={isSelected ? "default" : "ghost"}
                          size="sm"
                          className={`
                            flex flex-col items-center justify-center h-8 xs:h-10 sm:h-12 w-6 xs:w-8 sm:w-10 p-0.5 xs:p-1 text-center
                            ${isSelected 
                              ? 'bg-primary text-primary-foreground hover-primary-90' 
                              : 'hover-accent touch-active'
                            }
                            ${isWeekendDay && !isSelected ? 'text-emerald-600 dark:text-emerald-400 hover-emerald-700 dark:hover-emerald-300 hover-emerald-50 dark:hover-emerald-900-20' : ''}
                          `}
                        >
                          <span className="text-[10px] xs:text-xs sm:text-sm font-semibold leading-none">
                            {dayNumber}
                          </span>
                          <span className="text-[7px] xs:text-[8px] sm:text-[10px] font-medium leading-none mt-0.5 xs:mt-1 opacity-70">
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
      <div className="shrink-0 mr-1 xs:mr-2 sm:mr-4 flex items-center gap-1 xs:gap-2">
        {/* Dark Mode Toggle */}
        <Button
          onClick={toggleDarkMode}
          variant="outline"
          size="sm"
          className="text-[10px] xs:text-xs h-6 xs:h-7 sm:h-8 w-6 xs:w-7 sm:w-8 p-0"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun className="h-3 xs:h-4 w-3 xs:w-4" /> : <Moon className="h-3 xs:h-4 w-3 xs:w-4" />}
        </Button>
        
        {/* Share Link Button */}
        {onShareLink && (
          <Button
            onClick={onShareLink}
            variant="outline"
            size="sm"
            className="text-[8px] xs:text-[10px] sm:text-xs h-6 xs:h-7 sm:h-8 px-1 xs:px-2 sm:px-3"
          >
            <span className="hidden xs:inline">Share Link</span>
            <span className="xs:hidden">Share</span>
          </Button>
        )}
      </div>
    </div>
  );
};
