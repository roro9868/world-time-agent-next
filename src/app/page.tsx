'use client';
import React, { useRef, useCallback, useLayoutEffect, useState, useEffect } from 'react';
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
  useEffect(() => {
    if (locations && locations.length > 0) setHasInitialized(true);
  }, [locations]);

  const tableRef = useRef<HTMLDivElement>(null);
  const [overlayStyle, setOverlayStyle] = useState<{
    left: number;
    width: number;
    top: number;
    height: number;
  } | null>(null);

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

  useLayoutEffect(() => {
    let rafId: number | null = null;
    function calculateOverlay() {
      if (!tableRef.current || !selectedUtcDate || locations.length === 0) {
        setOverlayStyle(null);
        return;
      }
      const table = tableRef.current.querySelector('table');
      if (!table) return;
      const bodyRows = table.querySelectorAll('tbody tr');
      if (bodyRows.length < 2) return;
      const firstRow = bodyRows[0];
      const lastCityRow = bodyRows[bodyRows.length - 2];
      const cells = firstRow.querySelectorAll('td');
      if (!cells.length) return;
      let colIdx = -1;
      if (locations.length > 0) {
        const firstLocation = locations[0];
        const timeSlots = generateAlignedTimeSlots(
          anchorDate,
          homeTimezone,
          firstLocation.timezone.name,
          anchorDate,
          selectedUtcDate,
        );
        colIdx = timeSlots.findIndex((slot) => slot.utc.getTime() === selectedUtcDate.getTime());
      }
      if (colIdx === -1) {
        setOverlayStyle(null);
        return;
      }
      const cell = cells[colIdx + 1];
      if (!cell) return;
      const cellRect = (cell as HTMLElement).getBoundingClientRect();
      const parentRect = tableRef.current.getBoundingClientRect();
      const firstRowRect = firstRow.getBoundingClientRect();
      const lastCityCells = lastCityRow.querySelectorAll('td');
      const lastCell = lastCityCells[colIdx + 1];
      if (!lastCell) return;
      const lastCellRect = (lastCell as HTMLElement).getBoundingClientRect();
      let overlayTop = firstRowRect.top - parentRect.top;
      let overlayHeight = lastCellRect.bottom - firstRowRect.top;
      if (overlayHeight < 0) overlayHeight = 0;
      setOverlayStyle({
        left: cellRect.left - parentRect.left,
        width: cellRect.width - 1,
        top: overlayTop,
        height: overlayHeight,
      });
    }
    rafId = window.requestAnimationFrame(calculateOverlay);
    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [selectedUtcDate, locations, anchorDate, homeTimezone]);

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
    (colIdx: number, slotUtc: Date, slotLocal: Date, slotTimezone: string) => {
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
        <div className="container mx-auto px-2 xs:px-4 py-4 xs:py-6 sm:py-8 max-w-7xl">
          {/* Header */}
          <div className="w-full bg-slate-800 text-white shadow-lg mb-0 -mx-2 xs:-mx-4 -mt-4 xs:-mt-6 sm:-mt-8 mb-6">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <Globe className="h-6 w-6 text-teal-400" />
                </div>
                <h1 className="text-xl font-bold text-white">World Time Agent</h1>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-300 hover:text-white cursor-pointer">My Cities</span>
                <span className="text-gray-300 hover:text-white cursor-pointer">Explore</span>
                <span className="text-gray-300 hover:text-white cursor-pointer">Settings</span>
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">A</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* DateBar */}
          <div className="mb-6 flex justify-center">
            <div className="w-full max-w-4xl bg-card border rounded-lg shadow-sm p-4">
              <DateBar
                selectedDate={selectedTime}
                onDateChange={handleDateChange}
                homeTimezone={homeTimezone}
              />
            </div>
          </div>
          
          {/* Time Zone Table Layout */}
          <div className="flex justify-center">
            <div className="w-full max-w-6xl bg-card border rounded-lg shadow-sm relative overflow-hidden">
              <div ref={tableRef}>
                {/* Overlay for selected time column */}
                {overlayStyle && (
                  <div
                    className="absolute pointer-events-none z-20 border-2 border-black bg-transparent"
                    style={{
                      left: overlayStyle.left,
                      width: overlayStyle.width,
                      top: overlayStyle.top,
                      height: overlayStyle.height,
                      boxSizing: 'border-box',
                    }}
                  />
                )}
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
                      <table className="w-full border-separate border-spacing-0 min-w-[900px] sm:min-w-[1100px] lg:min-w-[1300px]">
                        <tbody>
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
                          <LocationSelector
                            onAddLocation={memoizedAddLocation}
                            existingLocations={locations.map((l) => l.timezone)}
                          />
                        </tbody>
                      </table>
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
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
    </ErrorBoundary>
  );
}
