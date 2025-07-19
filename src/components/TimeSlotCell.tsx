import React from 'react';
import type { TimeSlot, TimeZone } from '../types';
import { formatInTimeZone } from 'date-fns-tz';

import { Button } from "./ui/button";

interface TimeSlotCellProps {
  slot: TimeSlot;
  colIdx: number;
  timeSlots: TimeSlot[];
  timezone: TimeZone;
  onTimeSlotClick: (colIdx: number, utc: Date, localDate: Date, timezoneName: string) => void;
}

const getTimeSlotStyling = (
  slot: TimeSlot,
  isSelected: boolean,
): { className: string; variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined } => {
  if (isSelected) {
    return {
      className: 'bg-slate-600 dark:bg-blue-500 text-white border-slate-500 dark:border-blue-400 ring-2 ring-slate-400/50 dark:ring-blue-300/50 hover-slate-700 dark:hover-blue-600 shadow-md',
      variant: 'default'
    };
  }

  // Day/night background colors with much better dark mode contrast
  const isDaytime = slot.hour >= 7 && slot.hour < 19;
  const bgClass = isDaytime 
    ? 'bg-amber-100/80 hover-amber-200 border-amber-200/60 dark:bg-amber-800/50 dark:hover-amber-700 dark:border-amber-600/50 dark:text-amber-100' 
    : 'bg-blue-100/80 hover-blue-200 border-blue-200/60 dark:bg-blue-800/50 dark:hover-blue-700 dark:border-blue-600/50 dark:text-blue-100';
  
  return {
    className: `${bgClass} hover-accent touch-active`,
    variant: 'ghost' as const
  };
};

const TimeSlotCell: React.FC<TimeSlotCellProps> = React.memo(({
  slot,
  colIdx,
  timezone,
  onTimeSlotClick,
}) => {
  /**
   * Date label logic:
   * - Show the date label if this is the first column in the row (colIdx === 0)
   * - OR if the slot is at 12:00AM in the local time of the row's city
   *   (i.e., slot.hour === 0 && slot.minute === 0)
   *
   * This ensures:
   * - The first column always shows the date label for context
   * - Every local midnight also shows the date label
   */
  const showDateLabel =
    colIdx === 0 || (slot.hour === 0 && slot.minute === 0);



  // Always format the slot's time using the UTC base and the target timezone
  const formattedTime = formatInTimeZone(slot.utc, timezone.name, 'h:mm a');
  const [timeLabel, ampm] = formattedTime.split(' ');
  
  // Parse hour and minute for better display
  const hourPart = timeLabel.includes(':') ? timeLabel.split(':')[0] : timeLabel;
  const minutePart = timeLabel.includes(':') ? timeLabel.split(':')[1] : '00';
  
  const isHalfHour = minutePart === '30';
  // Create comprehensive aria-label for accessibility
  const ariaLabel = `${formattedTime} in ${timezone.city}. Click to select this time.`;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onTimeSlotClick(colIdx, slot.utc, slot.date, timezone.name);
    }
  };

  const styling = getTimeSlotStyling(slot, slot.isSelected);
  
  return (
    <td className="px-0 py-0 text-center align-middle relative w-6 xs:w-7 sm:w-8 lg:w-10">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Show date label for first column, or at every local midnight/12:30AM, overlapping the top of the button */}
        {showDateLabel && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px] xs:text-[8px] sm:text-[9px] lg:text-[10px] font-semibold text-foreground bg-card dark:bg-slate-800 px-0.5 xs:px-1 rounded pointer-events-none select-none whitespace-nowrap z-10 border border-border dark:border-slate-600 shadow-sm">
            {formatInTimeZone(slot.utc, timezone.name, 'MMM d')}
          </div>
        )}
        <Button
          onClick={() => {
            onTimeSlotClick(colIdx, slot.utc, slot.date, timezone.name);
          }}
          onKeyDown={handleKeyDown}
          variant={styling.variant}
          size="sm"
          className={`
            min-w-0 w-5 xs:w-6 sm:w-7 lg:w-8 h-6 xs:h-8 sm:h-10 lg:h-12 px-0 py-0.5 rounded-sm font-normal text-[8px] xs:text-[10px] sm:text-xs lg:text-sm
            transition-all duration-200 flex flex-col items-center justify-center gap-0
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
            ${styling.className}
          `}
          aria-label={ariaLabel}
          title={`${formattedTime} - Click to select`}
          tabIndex={0}
        >
          <div className="flex items-center justify-center">
            <span className="text-[10px] xs:text-xs sm:text-sm lg:text-base leading-none font-bold">
              {hourPart}
            </span>
            {isHalfHour && (
              <span className="text-[7px] xs:text-[8px] sm:text-[9px] lg:text-[10px] leading-none font-medium opacity-75">
                :30
              </span>
            )}
          </div>
          {ampm && (
            <span className="text-[7px] xs:text-[8px] sm:text-[9px] lg:text-[10px] leading-none font-medium opacity-75 uppercase">
              {ampm}
            </span>
          )}
        </Button>
      </div>
    </td>
  );
});

TimeSlotCell.displayName = 'TimeSlotCell';

export default TimeSlotCell;