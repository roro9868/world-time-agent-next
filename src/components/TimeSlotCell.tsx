import React from 'react';
import { TimeSlot, TimeZone } from '../types';
import { formatInTimeZone } from 'date-fns-tz';
import { getSlotBgColor } from '../utils/time/calculations';

interface TimeSlotCellProps {
  slot: TimeSlot;
  colIdx: number;
  timeSlots: TimeSlot[];
  timezone: TimeZone;
  onTimeSlotClick: (colIdx: number, utc: Date, localDate: Date, timezoneName: string) => void;
  selectedTime: Date;
}

const getTimeSlotBackgroundColor = (slot: TimeSlot, isSelected: boolean, isCurrent: boolean): string => {
  // Remove blue highlight for selected slot
  if (isCurrent) return 'ring-2 ring-green-400';
  return getSlotBgColor(slot.hour, slot.minute);
};

const TimeSlotCell: React.FC<TimeSlotCellProps> = ({
  slot,
  colIdx,
  timeSlots,
  timezone,
  onTimeSlotClick,
  selectedTime,
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
  const showDateLabel = colIdx === 0 || (slot.hour === 0 && (slot.minute === 0 || slot.minute === 30));

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
  const isSelected = slot.hour === selectedTime.getHours() && slot.minute === selectedTime.getMinutes();
  
  // Create comprehensive aria-label for accessibility
  const ariaLabel = `${formattedTime} in ${timezone.city}${slot.isCurrent ? ' - Current time' : ''}${isSelected ? ' - Selected time' : ''}. Click to select this time.`;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onTimeSlotClick(colIdx, slot.utc, slot.date, timezone.name);
    }
  };

  return (
    <td className="px-0.5 py-0 text-center align-middle relative">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Show date label for first column, or at every local midnight/12:30AM, overlapping the top of the button */}
        {showDateLabel && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] sm:text-[10px] font-semibold text-primary-700 pointer-events-none select-none whitespace-nowrap z-5">
            {formatInTimeZone(slot.utc, timezone.name, 'MMM d')}
          </div>
        )}
        <button
          onClick={() => onTimeSlotClick(colIdx, slot.utc, slot.date, timezone.name)}
          onKeyDown={handleKeyDown}
          className={`min-w-0 w-7 sm:w-9 px-0 py-2 rounded-sm text-base font-normal transition-all duration-200 flex flex-col items-center justify-center gap-y-0
            ${getTimeSlotBackgroundColor(slot, isSelected, slot.isCurrent)}
            hover:bg-primary-100
            focus:outline-none focus:ring-0
          `}
          aria-label={ariaLabel}
          title={`${formattedTime} - ${slot.isCurrent ? 'Current time' : 'Click to select'}`}
          tabIndex={0}
        >
          <span className={
            timeLabel.includes(':')
              ? 'text-xs sm:text-sm leading-none'
              : 'text-sm sm:text-base leading-none'
          } style={{ lineHeight: '1.05' }}>{timeLabel}</span>
          {ampm && <span className="text-[10px] sm:text-xs leading-none -mt" style={{ lineHeight: '1.05' }}>{ampm}</span>}
        </button>
      </div>
    </td>
  );
};

export default React.memo(TimeSlotCell); 