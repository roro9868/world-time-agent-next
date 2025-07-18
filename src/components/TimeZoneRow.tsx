import React from 'react';
import { Location } from '../types';
import { getTimezoneAbbrForDate, formatCurrentTimeInZone } from '../utils/timeUtils';
import TimeSlotCell from './TimeSlotCell';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { generateAlignedTimeSlots } from '../utils/timeUtils';
import { Button } from './ui/button';

interface TimeZoneRowProps {
  location: Location;
  onTimeSlotClick: (colIdx: number, utc: Date, localDate: Date, timezoneName: string) => void;
  onRemove: (id: string) => void;
  isHome?: boolean;
  homeTimezone?: string;
  anchorDate: Date;
  selectedUtcDate: Date;
}

// Extract header cell component for reusability
const TimeZoneHeaderCell: React.FC<{
  location: Location;
  isHome: boolean;
  homeTimezone: string;
  onRemove: (id: string) => void;
  dragHandleProps?: any;
}> = React.memo(({ location, isHome, homeTimezone, onRemove, dragHandleProps }) => (
  <td
    className={`sticky left-0 z-20 px-1.5 sm:px-3 py-1.5 sm:py-2.5 align-top border-r border-gray-100 min-w-[100px] max-w-[220px] w-auto whitespace-nowrap truncate transition-colors group-hover:bg-primary-50 ${isHome ? 'bg-gray-100' : 'bg-white'}`}
  >
    <div className="flex items-start space-x-1 sm:space-x-2">
      {/* Drag Handle */}
      <Button
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing p-0.5 sm:p-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 touch-none"
        title="Drag to reorder"
        type="button"
        aria-label={`Drag ${location.timezone.city} to reorder`}
        onMouseDown={(e) => {
          e.stopPropagation();
          dragHandleProps.onMouseDown?.(e);
        }}
        variant="ghost"
        size="icon"
      >
        <GripVertical className="w-3 sm:w-4 h-3 sm:h-4" />
      </Button>
      <span
        className="text-lg sm:text-xl flex-shrink-0"
        role="img"
        aria-label={`Flag of ${location.timezone.country}`}
      >
        {location.timezone.flag}
      </span>
      <div className="flex flex-col min-w-0 flex-1">
        {/* First row: city + abbr + remove button */}
        <div className="flex items-center min-w-0">
          <span className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap truncate">
            {location.timezone.city}
          </span>
          <span className="ml-1 sm:ml-2 px-0.5 sm:px-1 py-0.5 rounded bg-gray-100 text-[8px] sm:text-[10px] font-semibold text-gray-500 align-middle whitespace-nowrap flex-shrink-0">
            {getTimezoneAbbrForDate(new Date(), location.timezone.name)}
          </span>
          <Button
            onClick={() => onRemove(location.id)}
            className="ml-1 sm:ml-2 p-0.5 sm:p-1 text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            title="Remove location"
            aria-label={`Remove ${location.timezone.city} from list`}
            variant="ghost"
            size="icon"
          >
            <svg
              className="w-3 sm:w-4 h-3 sm:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>
        {/* Second row: country + current time */}
        <div className="flex items-center text-[10px] sm:text-xs text-gray-500 whitespace-nowrap overflow-hidden">
          <span className="truncate max-w-[120px] sm:max-w-[140px]">
            {location.timezone.country}
          </span>
          <span className="ml-1 sm:ml-2 text-primary-700 font-bold flex-shrink-0">
            {formatCurrentTimeInZone(location.timezone.name)}
          </span>
        </div>
      </div>
    </div>
  </td>
));

const TimeZoneRow: React.FC<TimeZoneRowProps> = React.memo(
  ({
    location,
    onTimeSlotClick,
    onRemove,
    isHome = false,
    homeTimezone,
    anchorDate,
    selectedUtcDate,
  }) => {
    const { timezone } = location;
    const isHomeRow = homeTimezone && timezone.name === homeTimezone;

    // Memoize timeSlots for this row only
    const timeSlots = React.useMemo(() => {
      return generateAlignedTimeSlots(
        anchorDate,
        homeTimezone || timezone.name,
        timezone.name,
        anchorDate,
        selectedUtcDate,
      );
    }, [anchorDate, homeTimezone, timezone.name, selectedUtcDate]);

    // Make the row draggable
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: location.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <tr
        ref={setNodeRef}
        style={style}
        className={`group hover:bg-primary-50 transition-colors ${
          isHomeRow ? 'bg-gray-100 border-l-8 border-l-primary-600 shadow-md' : ''
        } ${isDragging ? 'opacity-50' : ''}`}
        aria-label={`Time zone row for ${location.timezone.city}`}
        {...attributes}
        {...listeners}
      >
        {/* City Info */}
        <TimeZoneHeaderCell
          location={location}
          isHome={!!isHomeRow}
          homeTimezone={homeTimezone || ''}
          onRemove={onRemove}
          dragHandleProps={listeners}
        />
        {/* Hour Slots */}
        {timeSlots.map((slot, colIdx) => (
          <TimeSlotCell
            key={colIdx}
            slot={slot}
            colIdx={colIdx}
            timeSlots={timeSlots}
            timezone={timezone}
            onTimeSlotClick={() => onTimeSlotClick(colIdx, slot.utc, slot.date, timezone.name)}
          />
        ))}
      </tr>
    );
  },
);

export default React.memo(TimeZoneRow);
