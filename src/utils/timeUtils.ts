import { isWeekend } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import type { TimeSlot } from '../types';
import { getCurrentTimezoneAbbr, getTimezoneAbbrForDate } from './timezoneAbbr';

/**
 * Formats a date for display in a specific timezone
 * @param date - The date to format
 * @param timeZone - IANA timezone identifier (e.g., 'Asia/Shanghai')
 * @returns Formatted time string in 'h:mm a' format
 * @example
 * formatTime(new Date(), 'America/New_York') // "2:30 PM"
 */
export const formatTime = (date: Date, timeZone: string): string => {
  return formatInTimeZone(date, timeZone, 'h:mm a');
};

/**
 * Gets the current time in a specific timezone
 * Note: Returns current UTC time as formatting will handle timezone conversion
 * @returns Current Date object (UTC)
 * @example
 * getCurrentTimeInZone() // Current Date object
 */
export const getCurrentTimeInZone = (): Date => {
  // Always return the current UTC time; formatting will handle the zone
  return new Date();
};

/**
 * Formats the current time in a specific timezone
 * @param timeZone - IANA timezone identifier
 * @returns Current time formatted as 'h:mm a' in the specified timezone
 * @example
 * formatCurrentTimeInZone('Asia/Tokyo') // "11:45 PM"
 */
export const formatCurrentTimeInZone = (timeZone: string): string => {
  return formatInTimeZone(new Date(), timeZone, 'h:mm a');
};

// Converts a wall clock time in fromZone to the corresponding wall clock time in toZone
export const convertTimeToZone = (date: Date, fromZone: string, toZone: string): Date => {
  const utcDate = fromZonedTime(date, fromZone);
  return toZonedTime(utcDate, toZone);
};

/**
 * Generates aligned time slots for timezone comparison
 * Creates a 26-hour timeline starting from midnight in the home timezone 
 * and showing corresponding times in the target timezone
 * 
 * @param baseDate - The reference date in home timezone (local time)
 * @param homeTimezone - IANA timezone identifier for home location
 * @param targetTimezone - IANA timezone identifier for target location
 * @param selectedTime - Currently selected time for highlighting (optional)
 * @param selectedUtcDate - Selected UTC date for calculations (optional)
 * @returns Array of TimeSlot objects with local and UTC times
 * 
 * @example
 * const slots = generateAlignedTimeSlots(
 *   new Date('2024-01-01'),
 *   'America/New_York',
 *   'Asia/Tokyo',
 *   new Date()
 * );
 * // Returns 26 time slots showing Tokyo times aligned to NYC midnight
 */
export function generateAlignedTimeSlots(
  baseDate: Date, // selected date (local time)
  homeTimezone: string,
  targetTimezone: string,
  selectedTime?: Date,
  selectedUtcDate?: Date,
  selectedColumnIndex?: number,
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Start at midnight in the home timezone
  const homeMidnight = new Date(baseDate);
  homeMidnight.setHours(0, 0, 0, 0);
  const utcBase = fromZonedTime(homeMidnight, homeTimezone);

  // Always generate 26 slots (24 hours + 2 extra hours for next day)
  const increments = 26;

  for (let i = 0; i < increments; i++) {
    const minutesToAdd = i * 60;
    // The UTC time for this slot (aligned to home city's midnight)
    const utcSlot = new Date(utcBase.getTime() + minutesToAdd * 60 * 1000);
    // Convert to the target city's local time
    const localDate = toZonedTime(utcSlot, targetTimezone);
    const isWeekendDay = isWeekend(localDate);
    // Use column index for selection instead of UTC time matching
    const isSelected = selectedColumnIndex !== undefined ? i === selectedColumnIndex : false;
    

    // Determine if this is the first slot of a new local day
    let isMidnight = false;
    if (i === 0) {
      isMidnight = true;
    } else {
      const prevMinutesToAdd = (i - 1) * 60;
      const prevUtcSlot = new Date(utcBase.getTime() + prevMinutesToAdd * 60 * 1000);
      const prevLocalDate = toZonedTime(prevUtcSlot, targetTimezone);
      isMidnight =
        formatInTimeZone(prevLocalDate, targetTimezone, 'yyyy-MM-dd') !==
        formatInTimeZone(localDate, targetTimezone, 'yyyy-MM-dd');
    }
    slots.push({
      hour: localDate.getHours(),
      minute: localDate.getMinutes(),
      time: formatTime(localDate, targetTimezone),
      date: localDate,
      utc: utcSlot,
      isCurrent: false, // Always false since we removed current time highlighting
      isSelected,
      isWeekend: isWeekendDay,
      isMidnight,
    });
  }
  return slots;
}

// Re-export timezone abbreviation functions from our lightweight implementation
export { getCurrentTimezoneAbbr, getTimezoneAbbrForDate };

// Get current timezone offset in hours
export const getCurrentTimezoneOffset = (timeZone: string): number => {
  const now = new Date();
  const utc = toZonedTime(now, timeZone);
  const local = toZonedTime(now, timeZone);
  return (local.getTime() - utc.getTime()) / (1000 * 60 * 60);
};

// Utility: getSlotBgColor
export function getSlotBgColor(hour: number, minute: number): string {
  const totalMinutes = hour * 60 + minute;
  // Day: 7:00 AM (420 minutes) to 6:59 PM (1139 minutes)
  const isDaytime = totalMinutes >= 420 && totalMinutes < 1140;
  return isDaytime ? 'bg-amber-50' : 'bg-blue-50';
}

// Returns true if the slot is at midnight (any minute)
export function isSlotMidnight(slot: { hour: number; minute: number }): boolean {
  return slot.hour === 0;
}

// Date helper functions (moved from dateHelpers.ts)
export function generateDateRange(startDate: Date, count: number, homeTimezone?: string): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    let date: Date;
    if (homeTimezone) {
      // Use the home timezone to get the correct local date
      const base = toZonedTime(startDate, homeTimezone);
      date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    } else {
      // Fallback to UTC (legacy behavior)
      date = new Date(Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate() + i,
      ));
    }
    dates.push(date);
  }
  return dates;
}

export function groupByMonth(dates: Date[]): Array<{ month: string; start: number; end: number }> {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const groups: Array<{ month: string; start: number; end: number }> = [];
  let currentMonthIdx = -1;
  let startIndex = 0;

  dates.forEach((date, index) => {
    const monthIdx = date.getUTCMonth();
    if (monthIdx !== currentMonthIdx) {
      if (currentMonthIdx !== -1) {
        groups.push({ month: MONTHS[currentMonthIdx], start: startIndex, end: index - 1 });
      }
      currentMonthIdx = monthIdx;
      startIndex = index;
    }
  });

  // Add the last group
  if (currentMonthIdx !== -1) {
    groups.push({ month: MONTHS[currentMonthIdx], start: startIndex, end: dates.length - 1 });
  }

  return groups;
}

export function formatDateForDisplay(date: Date): { day: number; weekday: string } {
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    day: date.getUTCDate(),
    weekday: WEEKDAYS[date.getUTCDay()],
  };
}
