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
      className: 'bg-slate-600 text-white border-slate-500 ring-2 ring-slate-400/50 hover:bg-slate-700 shadow-md',
      variant: 'default'
    };
  }
  
  if (isCurrent) {
    return {
      className: 'bg-teal-100 text-teal-800 border-teal-300 ring-2 ring-teal-400/50 hover:bg-teal-200',
      variant: 'outline'
    };
  }

  // Day/night background colors
  const isDaytime = slot.hour >= 7 && slot.hour < 19;
  const bgClass = isDaytime ? 'bg-amber-50/50 hover:bg-amber-100/70' : 'bg-slate-50/50 hover:bg-slate-100/70';
  
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
    <td className="px-0 py-0 text-center align-middle relative min-w-[24px] xs:min-w-[32px] sm:min-w-[40px]">
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
            min-w-0 w-6 xs:w-8 sm:w-10 h-10 xs:h-12 sm:h-14 px-0 py-0.5 rounded-sm font-normal text-xs xs:text-sm
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
                ? 'text-xs xs:text-sm leading-none font-medium'
                : 'text-sm xs:text-base leading-none font-bold'
            }
          >
            {timeLabel}
          </span>
          {ampm && (
            <span className="text-[8px] xs:text-[10px] leading-none font-medium opacity-75 uppercase">
              {ampm}
            </span>
          )}
        </Button>
      </div>
    </td>
  );
};

export default TimeSlotCell;