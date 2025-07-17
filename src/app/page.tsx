'use client';
import React, { useRef, useCallback, useLayoutEffect, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Clock } from 'lucide-react';
import { LocationSelector } from '@/components/LocationSelector';
import { Location } from '@/types';
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
  DragEndEvent,
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
      <div className="min-h-screen transition-colors duration-300">
        <div className="mx-auto pl-1 pr-1 sm:pl-2 sm:pr-2 py-4 sm:py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4 sm:mb-8"
          >
            <div className="flex items-center justify-center space-x-2">
              <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">World Time Agent</h1>
            </div>
          </motion.div>
          {/* DateBar - center aligned */}
          <div className="mb-2 sm:mb-4 flex justify-center">
            <div className="min-w-[280px] sm:min-w-[320px] max-w-full bg-white rounded-xl shadow px-2 sm:px-4 py-1 sm:py-2 overflow-x-auto whitespace-nowrap">
              <DateBar
                selectedDate={selectedTime}
                onDateChange={handleDateChange}
                homeTimezone={homeTimezone}
              />
            </div>
          </div>
          {/* Time Zone Table Layout */}
          <div className="flex justify-center">
            <div className="max-w-[1400px] bg-white rounded-xl shadow-lg relative overflow-hidden">
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
                    <div className="overflow-x-auto scrollbar-thin w-full max-w-full pr-2 sm:pr-4">
                      <table className="w-full table-auto border-separate border-spacing-y-0 min-w-[800px] sm:min-w-[1000px] max-w-[1400px]">
                        <thead>
                          <tr>
                            <th className="sticky left-0 z-20 bg-white px-2 sm:px-4 py-1 sm:py-2 text-left font-semibold text-gray-700 whitespace-nowrap align-middle min-w-[100px] max-w-[220px] w-auto truncate"></th>
                            <th colSpan={26} className="p-0 align-middle"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {locations.map((location, rowIdx) => (
                            <TimeZoneRow
                              key={location.id}
                              location={location}
                              selectedTime={selectedTime}
                              onTimeSlotClick={memoizedHandleTimeSlotClick}
                              onRemove={memoizedRemoveLocation}
                              isHome={rowIdx === 0}
                              homeTimezone={homeTimezone}
                              anchorDate={anchorDate}
                              selectedUtcDate={selectedUtcDate || anchorDate}
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No locations added</h3>
              <p className="text-gray-600">Add your first location to get started</p>
            </motion.div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
