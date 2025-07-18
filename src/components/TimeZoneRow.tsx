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
    className={`sticky left-0 z-20 px-4 py-3 align-top border-r border-border min-w-[200px] transition-colors group-hover:bg-muted/50 ${
      isHome ? 'bg-muted/30' : 'bg-card'
    }`}
  >
    <div className="flex items-start gap-2">
      {/* Drag Handle */}
      <Button
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing shrink-0 h-6 w-6 p-0 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-none"
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
        <GripVertical className="h-4 w-4" />
      </Button>
      <span
        className="text-xl shrink-0"
        role="img"
        aria-label={`Flag of ${location.timezone.country}`}
      >
        {location.timezone.flag}
      </span>
      <div className="flex flex-col min-w-0 flex-1">
        {/* First row: city + abbr + remove button */}
        <div className="flex items-center min-w-0 gap-2">
          <span className="text-sm font-semibold text-foreground truncate">
            {location.timezone.city}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] font-medium whitespace-nowrap shrink-0">
            {getTimezoneAbbrForDate(new Date(), location.timezone.name)}
          </span>
          {!isHome && (
            <Button
              onClick={() => onRemove(location.id)}
              className="ml-auto shrink-0 h-5 w-5 p-0 text-muted-foreground hover:text-destructive transition-colors"
              title="Remove location"
              aria-label={`Remove ${location.timezone.city} from list`}
              variant="ghost"
              size="icon"
            >
              <svg
                className="h-3 w-3"
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
          )}
        </div>
        {/* Second row: country + current time */}
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span className="truncate max-w-[140px]">
            {location.timezone.country}
          </span>
          <span className="ml-2 text-primary font-semibold shrink-0">
            {formatCurrentTimeInZone(location.timezone.name)}
          </span>
          {isHome && (
            <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded shrink-0">
              Home
            </span>
          )}
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
        className={`group hover:bg-muted/30 transition-colors border-b border-border ${
          isHomeRow ? 'bg-muted/20 border-l-4 border-l-primary' : ''
        } ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
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
