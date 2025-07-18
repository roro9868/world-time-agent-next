'use client';
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Globe, Clock } from 'lucide-react';
import { LocationSelector } from '@/components/LocationSelector';
import type { Location } from '@/types';
import { generateAlignedTimeSlots } from '@/utils/timeUtils';
import { DateBar } from '@/components/DateBar';
import TimeZoneRow from '@/components/TimeZoneRow';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTimeZoneData } from '@/hooks/useTimeZoneData';
import { safeClipboardWrite } from '@/services/errorHandler';

export default function Home() {
  // All hooks must be called at the top level
  const {
    locations,
    selectedTime,
    selectedUtcDate,
    anchorDate,
    homeTimezone,
    addLocation,
    removeLocation,
    setSelectedTime,
    setSelectedUtcDate,
    setAnchorDate,
    updateLocations,
  } = useTimeZoneData();

  const [hasInitialized, setHasInitialized] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationVariant, setNotificationVariant] = useState<'success' | 'error'>('success');
  
  useEffect(() => {
    if (locations && locations.length > 0) setHasInitialized(true);
  }, [locations]);

  const showToast = useCallback((message: string, variant: 'success' | 'error' = 'success') => {
    setNotificationMessage(message);
    setNotificationVariant(variant);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  }, []);

  const tableRef = useRef<HTMLDivElement>(null);

  const getHomeMidnightDate = useCallback((date: Date, homeTimezone: string) => {
    const zoned = toZonedTime(date, homeTimezone);
    const year = zoned.getFullYear();
    const month = zoned.getMonth();
    const day = zoned.getDate();
    const utcMidnight = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const offsetMinutes = -toZonedTime(utcMidnight, homeTimezone).getTimezoneOffset();
    return new Date(utcMidnight.getTime() - offsetMinutes * 60 * 1000);
  }, []);

  useEffect(() => {
    if (!selectedUtcDate) return;
    const trueAnchor = getHomeMidnightDate(anchorDate, homeTimezone);
    const updatedLocations = locations.map((location) => ({
      ...location,
      timeSlots: generateAlignedTimeSlots(
        trueAnchor,
        homeTimezone,
        location.timezone.name,
        trueAnchor,
        selectedUtcDate,
      ),
    }));
    const isSame =
      locations.length === updatedLocations.length &&
      locations.every((loc, idx) => {
        const updated = updatedLocations[idx];
        if (loc.timeSlots.length !== updated.timeSlots.length) return false;
        for (let i = 0; i < loc.timeSlots.length; i++) {
          if (loc.timeSlots[i].utc.getTime() !== updated.timeSlots[i].utc.getTime()) return false;
        }
        return true;
      });
    if (!isSame) {
      updateLocations(updatedLocations);
    }
  }, [selectedUtcDate, anchorDate, homeTimezone, locations, updateLocations, getHomeMidnightDate]);

  const normalizeLocationIds = useCallback((locations: Location[]): Location[] => {
    return locations.map((loc, idx) => ({
      ...loc,
      id: idx === 0 ? 'local' : `${loc.timezone.name}:${loc.timezone.city}`,
    }));
  }, []);

  const handleReorderLocations = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = locations.findIndex((location) => location.id === active.id);
        const newIndex = locations.findIndex((location) => location.id === over.id);
        const newLocations = [...locations];
        const [movedLocation] = newLocations.splice(oldIndex, 1);
        newLocations.splice(newIndex, 0, movedLocation);
        const normalized = normalizeLocationIds(newLocations);
        updateLocations(normalized);
      }
    },
    [locations, updateLocations, normalizeLocationIds],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleTimeSlotClick = useCallback(
    (_colIdx: number, slotUtc: Date, _slotLocal: Date, _slotTimezone: string) => {
      setSelectedUtcDate(slotUtc);
      setSelectedTime(slotUtc);
      const dateStr = formatInTimeZone(slotUtc, homeTimezone, 'yyyy-MM-dd');
      const homeMidnight = new Date(`${dateStr}T00:00:00`);
      setAnchorDate(homeMidnight);
    },
    [setSelectedTime, setSelectedUtcDate, setAnchorDate, homeTimezone],
  );

  const handleDateChange = useCallback(
    (date: Date) => {
      const newAnchorDate = getHomeMidnightDate(date, homeTimezone);
      if (selectedUtcDate) {
        const selectedHomeTime = toZonedTime(selectedUtcDate, homeTimezone);
        const selectedHour = selectedHomeTime.getHours();
        const selectedMinute = selectedHomeTime.getMinutes();
        const newHomeTime = new Date(newAnchorDate);
        newHomeTime.setHours(selectedHour, selectedMinute, 0, 0);
        setSelectedUtcDate(newHomeTime);
        setSelectedTime(newHomeTime);
      }
      setAnchorDate(newAnchorDate);
    },
    [
      selectedUtcDate,
      homeTimezone,
      getHomeMidnightDate,
      setSelectedUtcDate,
      setSelectedTime,
      setAnchorDate,
    ],
  );

  const memoizedHandleTimeSlotClick = useCallback(handleTimeSlotClick, [handleTimeSlotClick]);
  const memoizedRemoveLocation = useCallback(removeLocation, [removeLocation]);
  const memoizedAddLocation = useCallback(addLocation, [addLocation]);

  const handleShareLink = useCallback(() => {
    const url = new URL(window.location.origin + window.location.pathname);
    
    // Add current state to URL params
    url.searchParams.set('cities', locations.map(l => `${l.timezone.name}:${l.timezone.city}`).join(','));
    url.searchParams.set('selectedTime', selectedTime.toISOString());
    url.searchParams.set('selectedUtcDate', selectedUtcDate?.toISOString() || selectedTime.toISOString());
    url.searchParams.set('anchorDate', anchorDate.toISOString());
    url.searchParams.set('homeTimezone', homeTimezone);
    
    // Copy to clipboard with error handling
    safeClipboardWrite(url.toString()).then((success: boolean) => {
      if (success) {
        showToast('Share link copied to clipboard!', 'success');
      } else {
        showToast('Failed to copy link to clipboard', 'error');
      }
    });
  }, [locations, selectedTime, selectedUtcDate, anchorDate, homeTimezone, showToast]);

  if (!hasInitialized && (!locations || locations.length === 0)) {
    return <div style={{ color: 'gray', textAlign: 'center', marginTop: 40 }}>Loading...</div>;
  }
  if (hasInitialized && (!locations || locations.length === 0)) {
    return (
      <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>
        No locations loaded. Check useTimeZoneData hook.
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background transition-colors duration-300">
        {/* Notification */}
        {showNotification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            notificationVariant === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{notificationMessage}</span>
              <button 
                onClick={() => setShowNotification(false)}
                className="ml-2 text-white hover:text-gray-200 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}
        <div className="w-full">
          {/* Header */}
          <div className="w-full bg-slate-800 text-white shadow-lg mb-6">
            <div className="container mx-auto px-4 py-3 flex items-center justify-center max-w-7xl">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <Globe className="h-6 w-6 text-teal-400" />
                </div>
                <h1 className="text-xl font-bold text-white">World Time Agent</h1>
              </div>
            </div>
          </div>
          
          {/* Time Zone Table Layout */}
          <div className="container mx-auto px-2 xs:px-4 max-w-7xl">
            <div className="w-full bg-card border rounded-lg shadow-sm relative overflow-hidden">
              <div ref={tableRef}>
                <DndContext
                  key={locations.map((l) => l.id).join(',')}
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleReorderLocations}
                >
                  <SortableContext
                    items={locations.map((location) => location.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="overflow-x-auto w-full touch-pan-x">
                      <table 
                        className="w-full border-separate border-spacing-0 min-w-[700px] sm:min-w-[800px] lg:min-w-[1000px]"
                        role="grid"
                        aria-label="Time zone comparison table"
                        aria-rowcount={locations.length + 1}
                        aria-colcount={27}
                      >
                        <tbody>
                          {/* DateBar Header Row */}
                          <tr 
                            className="border-b border-border bg-card"
                            role="row"
                            aria-rowindex={1}
                            aria-label="Date and location selector row"
                          >
                            <td 
                              className="sticky left-0 z-10 bg-card px-1 xs:px-2 py-2 border-r border-border min-w-[75px] xs:min-w-[80px] sm:min-w-[85px]"
                              role="gridcell"
                              aria-colindex={1}
                            >
                              <LocationSelector
                                onAddLocation={memoizedAddLocation}
                                existingLocations={locations.map((l) => l.timezone)}
                              />
                            </td>
                            <td className="px-0 py-2" colSpan={26}>
                              <div className="flex justify-center">
                                <DateBar
                                  selectedDate={selectedTime}
                                  onDateChange={handleDateChange}
                                  homeTimezone={homeTimezone}
                                  onShareLink={handleShareLink}
                                />
                              </div>
                            </td>
                          </tr>
                          {locations.map((location, rowIdx) => (
                            <TimeZoneRow
                              key={location.id}
                              location={location}
                              onTimeSlotClick={memoizedHandleTimeSlotClick}
                              onRemove={memoizedRemoveLocation}
                              isHome={rowIdx === 0}
                              homeTimezone={homeTimezone}
                              anchorDate={anchorDate}
                              selectedUtcDate={selectedUtcDate || anchorDate}
                              totalLocations={locations.length}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
            {/* Empty State */}
            {locations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                <div className="bg-muted/50 rounded-full p-4 mb-4">
                  <Clock className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No locations added</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Add your first location to start tracking time across different timezones
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
