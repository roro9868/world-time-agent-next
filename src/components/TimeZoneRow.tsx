import React from 'react';
import type { Location } from '../types';
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
  totalLocations: number;
}

// Extract header cell component for reusability
const TimeZoneHeaderCell: React.FC<{
  location: Location;
  isHome: boolean;
  onRemove: (id: string) => void;
  dragHandleProps?: {
    onMouseDown?: (e: React.MouseEvent) => void;
  };
  totalLocations: number;
}> = React.memo(({ location, isHome, onRemove, dragHandleProps, totalLocations }) => {
  return (
  <td
    className={`sticky left-0 z-20 px-1 xs:px-2 py-2 xs:py-3 align-top border-r border-border min-w-[110px] xs:min-w-[125px] sm:min-w-[140px] transition-colors group-hover:bg-muted ${
      isHome ? 'bg-blue-50' : 'bg-card'
    } overflow-hidden`}
  >
    <div className="flex items-center gap-0.5 xs:gap-1">
      {/* Drag Handle */}
      <Button
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing shrink-0 h-4 xs:h-5 w-4 xs:w-5 p-0 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-none"
        title="Drag to reorder"
        type="button"
        aria-label={`Drag ${location.timezone.city} to reorder`}
        onMouseDown={(e) => {
          e.stopPropagation();
          dragHandleProps?.onMouseDown?.(e);
        }}
        variant="ghost"
        size="icon"
      >
        <GripVertical className="h-3 w-3" />
      </Button>
      <span
        className="text-base xs:text-lg sm:text-xl shrink-0"
        role="img"
        aria-label={`Flag of ${location.timezone.country}`}
      >
        {location.timezone.flag}
      </span>
      <div className="flex flex-col min-w-0 flex-1">
        {/* First row: city + abbr + home + remove button */}
        <div className="flex items-center min-w-0 gap-1">
          <span className="text-xs xs:text-sm font-semibold text-foreground truncate">
            {location.timezone.city}
          </span>
          <span className="px-1 xs:px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[8px] xs:text-[10px] font-medium whitespace-nowrap shrink-0">
            {getTimezoneAbbrForDate(new Date(), location.timezone.name)}
          </span>
          {isHome && (
            <span className="px-1 xs:px-1.5 py-0.5 bg-teal-100 text-teal-700 text-[8px] xs:text-[10px] font-medium rounded shrink-0">
              Home
            </span>
          )}
          <Button
            onClick={() => onRemove(location.id)}
            disabled={totalLocations <= 1}
            className={`ml-auto shrink-0 h-4 xs:h-5 w-4 xs:w-5 p-0 transition-colors ${
              totalLocations <= 1 
                ? 'text-muted-foreground/30 cursor-not-allowed' 
                : 'text-muted-foreground hover:text-destructive'
            }`}
            title={
              totalLocations <= 1 
                ? "Cannot remove the last location" 
                : isHome 
                  ? "Remove home location" 
                  : "Remove location"
            }
            aria-label={`Remove ${location.timezone.city} from list`}
            variant="ghost"
            size="icon"
          >
            <svg
              className="h-2 xs:h-3 w-2 xs:w-3"
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
        <div className="flex items-center text-[10px] xs:text-xs text-muted-foreground mt-1">
          <span className="truncate max-w-[60px] xs:max-w-[70px] sm:max-w-[80px]" title={location.timezone.country}>
            {location.timezone.country.length > 12 ? location.timezone.country.substring(0, 12) + '...' : location.timezone.country}
          </span>
          <span className="ml-1 xs:ml-2 text-slate-700 font-semibold shrink-0 text-[10px] xs:text-xs">
            {formatCurrentTimeInZone(location.timezone.name)}
          </span>
        </div>
      </div>
    </div>
  </td>
  );
});

TimeZoneHeaderCell.displayName = 'TimeZoneHeaderCell';

const TimeZoneRow: React.FC<TimeZoneRowProps> = React.memo(
  ({
    location,
    onTimeSlotClick,
    onRemove,
    homeTimezone,
    anchorDate,
    selectedUtcDate,
    totalLocations,
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
        className={`group hover:bg-muted/30 transition-colors border-b border-border ${
          isHomeRow ? 'bg-blue-50/50 border-l-4 border-l-primary' : ''
        } ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
        aria-label={`Time zone row for ${location.timezone.city}`}
        {...attributes}
        {...listeners}
      >
        {/* City Info */}
        <TimeZoneHeaderCell
          location={location}
          isHome={!!isHomeRow}
          onRemove={onRemove}
          dragHandleProps={listeners}
          totalLocations={totalLocations}
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

TimeZoneRow.displayName = 'TimeZoneRow';

export default React.memo(TimeZoneRow);
