import React from 'react';
import type { TimeSlot, TimeZone } from '../types';
import { formatInTimeZone } from 'date-fns-tz';
import { getSlotBgColor } from '../utils/timeUtils';
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
  isCurrent: boolean,
): { className: string; variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined } => {
  if (isSelected) {
    return {
      className: 'bg-primary text-primary-foreground hover:bg-primary/90',
      variant: 'default'
    };
  }
  
  if (isCurrent) {
    return {
      className: 'bg-green-100 text-green-800 border-green-300 ring-2 ring-green-400/50 hover:bg-green-200',
      variant: 'outline'
    };
  }

  // Day/night background colors
  const isDaytime = slot.hour >= 7 && slot.hour < 19;
  const bgClass = isDaytime ? 'bg-amber-50/50 hover:bg-amber-100/70' : 'bg-blue-50/50 hover:bg-blue-100/70';
  
  return {
    className: `${bgClass} hover:bg-accent hover:text-accent-foreground`,
    variant: 'ghost' as const
  };
};

const TimeSlotCell: React.FC<TimeSlotCellProps> = ({
  slot,
  colIdx,
  timeSlots,
  timezone,
  onTimeSlotClick,
}) => {
  /**
   * Date label logic:
   * - Show the date label if this is the first column in the row (colIdx === 0)
   * - OR if the slot is at 12:00AM or 12:30AM in the local time of the row's city
   *   (i.e., slot.hour === 0 && (slot.minute === 0 || slot.minute === 30))
   *
   * This ensures:
   * - The first column always shows the date label for context
   * - Every local midnight (or 12:30AM for half-hour timezones) also shows the date label
   */
  const showDateLabel =
    colIdx === 0 || (slot.hour === 0 && (slot.minute === 0 || slot.minute === 30));

  // Debug: Log slot info for LA midnight slots
  // if (timezone.name === 'America/Los_Angeles' && isNewDay) {
  //   // eslint-disable-next-line no-console
  //   console.log('[CELL DEBUG] LA slot', {
  //     slotDate: slot.date,
  //     formatted: formatInTimeZone(slot.date, timezone.name, 'MMM d'),
  //     slot,
  //   });
  // }

  // Always format the slot's time using the UTC base and the target timezone
  const formattedTime = formatInTimeZone(slot.utc, timezone.name, 'h:mm a');
  let [timeLabel, ampm] = formattedTime.split(' ');
  // Remove ':00' for on-the-hour slots
  if (timeLabel.endsWith(':00')) {
    timeLabel = timeLabel.replace(':00', '');
  }
  // Create comprehensive aria-label for accessibility
  const ariaLabel = `${formattedTime} in ${timezone.city}. Click to select this time.`;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onTimeSlotClick(colIdx, slot.utc, slot.date, timezone.name);
    }
  };

  const styling = getTimeSlotStyling(slot, slot.isSelected, slot.isCurrent);
  
  return (
    <td className="px-0 py-0 text-center align-middle relative">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Show date label for first column, or at every local midnight/12:30AM, overlapping the top of the button */}
        {showDateLabel && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] sm:text-[10px] font-semibold text-primary bg-background px-1 rounded pointer-events-none select-none whitespace-nowrap z-10 border border-border">
            {formatInTimeZone(slot.utc, timezone.name, 'MMM d')}
          </div>
        )}
        <Button
          onClick={() => onTimeSlotClick(colIdx, slot.utc, slot.date, timezone.name)}
          onKeyDown={handleKeyDown}
          variant={styling.variant}
          size="sm"
          className={`
            min-w-0 w-5 xs:w-6 sm:w-8 h-8 xs:h-10 sm:h-12 px-0 py-0.5 rounded-sm font-normal text-[10px] xs:text-xs
            transition-all duration-200 flex flex-col items-center justify-center gap-0
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
            ${styling.className}
          `}
          aria-label={ariaLabel}
          title={`${formattedTime} - Click to select`}
          tabIndex={0}
        >
          <span
            className={
              timeLabel.includes(':')
                ? 'text-[8px] xs:text-[10px] leading-none font-medium'
                : 'text-[10px] xs:text-xs leading-none font-semibold'
            }
          >
            {timeLabel}
          </span>
          {ampm && (
            <span className="text-[6px] xs:text-[8px] leading-none font-medium opacity-75 uppercase">
              {ampm}
            </span>
          )}
        </Button>
      </div>
    </td>
  );
};

export default TimeSlotCell;