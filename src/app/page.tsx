'use client';
import React, { useCallback, useState, useEffect } from 'react';
import { Globe, Clock } from 'lucide-react';
import { LocationSelector } from '@/components/LocationSelector';
import type { Location } from '@/types';
import { generateAlignedTimeSlots } from '@/utils/timeUtils';
import { DateBar } from '@/components/DateBar';
import TimeZoneRow from '@/components/TimeZoneRow';
import { toZonedTime } from 'date-fns-tz';
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

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationVariant, setNotificationVariant] = useState<'success' | 'error'>('success');
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number>(() => {
    // Calculate current time column index on initial state
    const now = new Date();
    const homeTime = toZonedTime(now, homeTimezone);
    const currentHour = homeTime.getHours();
    return Math.min(Math.max(currentHour, 0), 25);
  });
  
  useEffect(() => {
    if (locations && locations.length > 0) {
      // Mark as initialized after a short delay to allow initial setup to complete
      setTimeout(() => {
        setIsInitialized(true);
      }, 100);
    }
  }, [locations, selectedColumnIndex, homeTimezone]);

  // Update selectedColumnIndex when home city changes to ensure it's valid
  useEffect(() => {
    if (!locations || locations.length === 0 || !selectedUtcDate) return;
    
    const homeLocation = locations[0];
    if (!homeLocation || !homeLocation.timeSlots) return;
    
    // Check if current selectedColumnIndex is valid for the new home city
    const currentSlot = homeLocation.timeSlots[selectedColumnIndex];
    if (!currentSlot) {
      
      // Find the time slot that matches the current selected time
      const matchingSlotIndex = homeLocation.timeSlots.findIndex(slot => 
        Math.abs(slot.utc.getTime() - selectedUtcDate.getTime()) < 60000 // Within 1 minute
      );
      
      if (matchingSlotIndex !== -1) {
        setSelectedColumnIndex(matchingSlotIndex);
      } else {
        // Fallback to current hour in home timezone
        const homeTime = toZonedTime(selectedUtcDate, homeTimezone);
        const currentHour = homeTime.getHours();
        const fallbackIndex = Math.min(Math.max(currentHour, 0), 25);
        setSelectedColumnIndex(fallbackIndex);
      }
    }
  }, [locations, selectedUtcDate, homeTimezone, selectedColumnIndex]);

  const showToast = useCallback((message: string, variant: 'success' | 'error' = 'success') => {
    setNotificationMessage(message);
    setNotificationVariant(variant);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  }, []);

  useEffect(() => {
    if (!selectedUtcDate) return;
    
    // Simplified: anchorDate is already a local date, use it directly
    const localAnchorDate = anchorDate;
    
    const updatedLocations = locations.map((location) => ({
      ...location,
      timeSlots: generateAlignedTimeSlots(
        localAnchorDate,
        homeTimezone,
        location.timezone.name,
        selectedColumnIndex,
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
  }, [selectedUtcDate, anchorDate, homeTimezone, locations, updateLocations, isInitialized, selectedColumnIndex]);

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
    (colIdx: number, utc: Date, localDate: Date) => {
      // Simplified: Just update the selected time and column index
      setSelectedUtcDate(utc);
      
      // Handle next day time slots (index 24 or 25)
      if (colIdx >= 24) {
        // Calculate the new anchor date for the next day
        const nextDayAnchor = new Date(anchorDate);
        nextDayAnchor.setDate(nextDayAnchor.getDate() + 1);
        setAnchorDate(nextDayAnchor);
        
        // Adjust column index for the new day
        const adjustedColIdx = colIdx - 24;
        setSelectedColumnIndex(adjustedColIdx);
      } else {
        setSelectedColumnIndex(colIdx);
      }
      
      // Always use the home city's date for selectedTime (not the selected city's date)
      // Get the home city's time slot at the same column index
      if (locations && locations.length > 0) {
        const homeLocation = locations[0];
        const homeTimeSlot = homeLocation.timeSlots[colIdx];
        if (homeTimeSlot) {
          setSelectedTime(homeTimeSlot.date); // Use home city's date
        } else {
          setSelectedTime(localDate); // Fallback to local date if home slot not found
        }
      } else {
        setSelectedTime(localDate); // Fallback to local date if no locations
      }
    },
    [setSelectedUtcDate, setSelectedTime, setSelectedColumnIndex, setAnchorDate, locations, anchorDate],
  );

  // Get the selected time cell from the home city row
  const selectedTimeCell = React.useMemo(() => {
    if (!locations || locations.length === 0) return null;
    
    const homeLocation = locations[0]; // First location is always the home location
    if (!homeLocation || !homeLocation.timeSlots) return null;
    
    // Simply get the time slot at the selected column index
    return homeLocation.timeSlots[selectedColumnIndex] || homeLocation.timeSlots[0] || null;
  }, [locations, selectedColumnIndex]);

  const handleDateChange = useCallback(
    (date: Date) => {
      // Simplified: Take the clicked date, extract year/month/day, create 12am local date
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      
      // Create 12am (midnight) of the clicked date in local timezone
      const newAnchorDate = new Date(year, month, day, 0, 0, 0, 0);
      
      // Preserve the current time of day from selectedTimeCell
      if (selectedTimeCell) {
        const selectedHour = selectedTimeCell.hour;
        const selectedMinute = selectedTimeCell.minute;
        
        const newHomeTime = new Date(newAnchorDate);
        newHomeTime.setHours(selectedHour, selectedMinute, 0, 0);
        
        setSelectedUtcDate(newHomeTime);
        setSelectedTime(newHomeTime);
      }
      
      setAnchorDate(newAnchorDate);
    },
    [selectedTimeCell, setSelectedUtcDate, setSelectedTime, setAnchorDate],
  );

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

  if (!isInitialized && (!locations || locations.length === 0)) {
    return <div style={{ color: 'gray', textAlign: 'center', marginTop: 40 }}>Loading...</div>;
  }
  if (isInitialized && (!locations || locations.length === 0)) {
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
                className="ml-2 text-white hover-gray-200 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}
        <div className="w-full">
          {/* Header */}
          <div className="w-full bg-slate-800 dark:bg-slate-900 text-white shadow-lg mb-6 border-b border-slate-700 dark:border-slate-600">
            <div className="container mx-auto px-4 py-3 flex items-center justify-center max-w-7xl">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <Globe className="h-6 w-6 text-teal-400 dark:text-teal-300" />
                </div>
                <h1 className="text-xl font-bold text-white">World Time Agent</h1>
              </div>
            </div>
          </div>
          
          {/* Time Zone Table Layout */}
          <div className="container mx-auto px-1 xs:px-2 sm:px-4 max-w-7xl">
            <div className="w-full bg-card border border-border dark:border-slate-600 rounded-lg shadow-sm relative overflow-hidden">
              
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
                        className="border-separate border-spacing-0 min-w-[500px] sm:min-w-[600px] lg:min-w-[800px]"
                        role="grid"
                        aria-label="Time zone comparison table"
                        aria-rowcount={locations.length + 1}
                        aria-colcount={27}
                        style={{
                          width: 'max-content',
                          tableLayout: 'auto'
                        }}
                      >
                        <tbody>
                          {/* DateBar Header Row */}
                          <tr 
                            className="border-b border-border dark:border-slate-600 bg-card"
                            role="row"
                            aria-rowindex={1}
                            aria-label="Date and location selector row"
                          >
                            <td 
                              className="sticky left-0 z-30 bg-card px-0.5 xs:px-1 sm:px-2 py-1 xs:py-2 border-r border-border dark:border-slate-600"
                              role="gridcell"
                              aria-colindex={1}
                              style={{
                                width: 'max-content',
                                maxWidth: '180px',
                                minWidth: '120px'
                              }}
                            >
                              <LocationSelector
                                onAddLocation={addLocation}
                                existingLocations={locations.map((l) => l.timezone)}
                              />
                            </td>
                            <td className="px-0.5 py-1 pb-1 xs:py-0.5 xs:pb-0.5 overflow-hidden" colSpan={26}>
                              <div className="flex justify-center overflow-hidden">
                                <DateBar
                                  selectedDate={selectedTime}
                                  onDateChange={handleDateChange}
                                  onShareLink={handleShareLink}
                                  anchorDate={anchorDate}
                                />
                              </div>
                            </td>
                          </tr>
                          {locations.map((location, rowIdx) => (
                            <TimeZoneRow
                              key={location.id}
                              location={location}
                              onTimeSlotClick={handleTimeSlotClick}
                              onRemove={removeLocation}
                              isHome={rowIdx === 0}
                              homeTimezone={homeTimezone}
                              anchorDate={anchorDate}
                              selectedColumnIndex={selectedColumnIndex}
                              totalLocations={locations.length}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </SortableContext>
                </DndContext>
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
