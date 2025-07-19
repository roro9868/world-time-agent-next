import React from 'react';
import type { Location } from '../types';
import { getTimezoneAbbrForDate, formatTime } from '../utils/timeUtils';
import TimeSlotCell from './TimeSlotCell';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { generateAlignedTimeSlots } from '../utils/timeUtils';
import { Button } from './ui/button';
import { Home as HomeIcon } from 'lucide-react';

interface TimeZoneRowProps {
  location: Location;
  onTimeSlotClick: (colIdx: number, utc: Date, localDate: Date) => void;
  onRemove: (id: string) => void;
  isHome?: boolean;
  homeTimezone?: string;
  anchorDate: Date;
  selectedColumnIndex: number;
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
    className={`sticky left-0 z-20 px-1 xs:px-2 py-2 xs:py-3 align-top border-r border-border transition-colors group-hover:bg-muted ${
      isHome ? 'bg-blue-100 dark:bg-blue-900/60 border-l-2 border-l-blue-500 dark:border-l-blue-400' : 'bg-card'
    } overflow-hidden`}
    style={{
      width: 'max-content',
      maxWidth: '200px',
      minWidth: '120px'
    }}
  >
    <div className="flex items-start gap-0.5 xs:gap-1">
      {/* Left column: Drag Handle and Remove Button */}
      <div className="flex flex-col items-center shrink-0">
        {/* Drag Handle - aligned with city name */}
        <div className="flex items-center h-5 xs:h-6">
          <Button
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing h-4 xs:h-5 w-4 xs:w-5 p-0 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-none"
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
        </div>
        {/* Remove Button - aligned with second row */}
        <div className="flex items-center h-5 xs:h-6 mt-1">
          <Button
            onClick={() => onRemove(location.id)}
            disabled={totalLocations <= 1}
            className={`h-4 xs:h-5 w-4 xs:w-5 p-0 transition-colors ${
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
      </div>
      
      {/* Right column: City info */}
      <div className="flex flex-col min-w-0 relative">
        {/* First row: city + flag + home icon */}
        <div className="flex items-center min-w-0 gap-1 h-5 xs:h-6">
          <span className="text-xs xs:text-sm font-semibold text-foreground">
            {location.timezone.city}
          </span>
          <span
            className="text-base xs:text-lg shrink-0"
            role="img"
            aria-label={`Flag of ${location.timezone.country}`}
          >
            {location.timezone.flag}
          </span>
          {isHome && (
            <span className="ml-1 flex items-center shrink-0">
              <HomeIcon className="w-4 h-4 text-yellow-500" strokeWidth={2.2} />
            </span>
          )}
        </div>
        {/* Second row: abbr + current time */}
        <div className="flex items-center text-[10px] xs:text-xs text-muted-foreground mt-1 h-5 xs:h-6">
          <span className="px-1 xs:px-1.5 py-0.5 rounded bg-secondary dark:bg-slate-700 text-secondary-foreground dark:text-slate-200 text-[8px] xs:text-[10px] font-medium whitespace-nowrap shrink-0 border border-border dark:border-slate-600">
            {getTimezoneAbbrForDate(new Date(), location.timezone.name)}
          </span>
          <span className="text-slate-700 dark:text-slate-200 font-semibold text-[10px] xs:text-xs ml-1">
            {formatTime(new Date(), location.timezone.name)}
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
    selectedColumnIndex,
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
        selectedColumnIndex,
      );
    }, [anchorDate, homeTimezone, timezone.name, selectedColumnIndex]);

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
          isHomeRow ? 'bg-blue-100/50 dark:bg-blue-900/30 border-l-4 border-l-blue-500 dark:border-l-blue-400' : ''
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
            onTimeSlotClick={() => onTimeSlotClick(colIdx, slot.utc, slot.date)}
          />
        ))}
      </tr>
    );
  },
);

TimeZoneRow.displayName = 'TimeZoneRow';

export default React.memo(TimeZoneRow);
