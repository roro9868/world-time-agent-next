import { isWeekend, isToday } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { TimeSlot } from '../types';
import moment from 'moment-timezone';

/*
 * Timezone Abbreviation Strategy
 *
 * This project uses moment-timezone to obtain timezone abbreviations for IANA timezones.
 *
 * Approach:
 * 1. For a given IANA timezone, we use moment-timezone's .zoneAbbr() to get the abbreviation (e.g., 'EST', 'EDT', 'CST').
 * 2. If the abbreviation returned is a numeric offset (e.g., '+03', '+0700'), we display it in the form 'GMT+3' or 'GMT+7' for clarity.
 * 3. We do not use a fallback library (like spacetime) or a custom mapping, because:
 *    - All major JS timezone libraries ultimately rely on the IANA tz database, which does not provide friendly abbreviations for all zones.
 *    - Fallbacks or custom mappings can introduce ambiguity or require ongoing maintenance.
 * 4. This approach ensures that for most zones, users see familiar abbreviations, and for others, a clear GMT offset is shown.
 *
 * If you need to support custom or friendlier abbreviations for specific zones in the future, consider adding a small custom mapping for just those cases.
 */

// Always use the IANA time zone name (e.g., 'Asia/Shanghai') for all calculations. Ignore the offset/abbreviation for current time.
export const formatTime = (date: Date, timeZone: string): string => {
  return formatInTimeZone(date, timeZone, 'h:mm a');
};

// Use only the IANA time zone name
// Returns the current time in the given timezone as a Date object
export const getCurrentTimeInZone = (timeZone: string): Date => {
  // Always return the current UTC time; formatting will handle the zone
  return new Date();
};

export const formatCurrentTimeInZone = (timeZone: string): string => {
  return formatInTimeZone(new Date(), timeZone, 'h:mm a');
};

// Converts a wall clock time in fromZone to the corresponding wall clock time in toZone
export const convertTimeToZone = (date: Date, fromZone: string, toZone: string): Date => {
  const utcDate = fromZonedTime(date, fromZone);
  return toZonedTime(utcDate, toZone);
};

// Generate time slots for a given date, aligning all cities to the home city's midnight
export function generateAlignedTimeSlots(
  baseDate: Date, // selected date (local time)
  homeTimezone: string,
  targetTimezone: string,
  selectedTime?: Date,
  selectedUtcDate?: Date,
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  // Start at midnight in the home timezone
  const homeMidnight = new Date(baseDate);
  homeMidnight.setHours(0, 0, 0, 0);
  const utcBase = fromZonedTime(homeMidnight, homeTimezone);

  // Determine if this timezone has a 30-minute offset
  const offsetMinutes = getCurrentTimezoneOffset(targetTimezone) * 60;
  const hasHalfHour = Math.abs(offsetMinutes % 60) === 30;
  // CHANGED: increments from 24 to 26 (whole hour), 48 to 52 (half hour)
  const increments = hasHalfHour ? 52 : 26;

  for (let i = 0; i < increments; i++) {
    const minutesToAdd = hasHalfHour ? i * 30 : i * 60;
    // The UTC time for this slot (aligned to home city's midnight)
    const utcSlot = new Date(utcBase.getTime() + minutesToAdd * 60 * 1000);
    // Convert to the target city's local time
    const localDate = toZonedTime(utcSlot, targetTimezone);
    const isCurrent =
      isToday(localDate) &&
      localDate.getHours() === new Date().getHours() &&
      localDate.getMinutes() === new Date().getMinutes();
    const isWeekendDay = isWeekend(localDate);
    const isSelected = selectedUtcDate ? utcSlot.getTime() === selectedUtcDate.getTime() : false;
    // Determine if this is the first slot of a new local day
    let isMidnight = false;
    if (i === 0) {
      isMidnight = true;
    } else {
      const prevMinutesToAdd = hasHalfHour ? (i - 1) * 30 : (i - 1) * 60;
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
      isCurrent,
      isSelected,
      isWeekend: isWeekendDay,
      isMidnight,
    });
  }
  return slots;
}

// Helper to check if abbreviation is a numeric offset
function isNumericAbbr(abbr: string): boolean {
  return /^([+-]?\d{2,4}|UTC[+-]?\d{1,2})$/.test(abbr);
}

// Get current timezone abbreviation (e.g., 'EST' vs 'EDT')
export const getCurrentTimezoneAbbr = (timeZone: string): string => {
  const now = new Date();
  try {
    const abbr = moment.tz(now, timeZone).zoneAbbr();
    if (!abbr || isNumericAbbr(abbr)) {
      // Fallback to numeric offset if abbreviation is missing or numeric
      const offset = moment.tz(now, timeZone).format('Z').replace(':', '');
      return formatNumericAbbrAsGMT(
        offset.startsWith('+') || offset.startsWith('-') ? offset : `+${offset}`,
      );
    }
    return abbr;
  } catch (e) {
    // Fallback: return 'GMT'
    return 'GMT';
  }
};

// Get timezone abbreviation for a specific date
export const getTimezoneAbbrForDate = (date: Date, timeZone: string): string => {
  try {
    const abbr = moment.tz(date, timeZone).zoneAbbr();
    if (!abbr || isNumericAbbr(abbr)) {
      const offset = moment.tz(date, timeZone).format('Z').replace(':', '');
      return formatNumericAbbrAsGMT(
        offset.startsWith('+') || offset.startsWith('-') ? offset : `+${offset}`,
      );
    }
    return abbr;
  } catch (e) {
    return 'GMT';
  }
};

// Format numeric abbreviation as GMT+X or GMT-X
function formatNumericAbbrAsGMT(abbr: string): string {
  // Handles +03, -07, +0700, -0300, etc.
  const match = abbr.match(/^([+-])(\d{2})(\d{2})?$/);
  if (match) {
    const sign = match[1];
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;
    let gmt = `GMT${sign}${hours}`;
    if (minutes) {
      gmt += `:${minutes.toString().padStart(2, '0')}`;
    }
    return gmt;
  }
  // Handles +07, -03, etc.
  const matchShort = abbr.match(/^([+-])(\d{2})$/);
  if (matchShort) {
    return `GMT${matchShort[1]}${parseInt(matchShort[2], 10)}`;
  }
  // Handles UTC+X
  if (/^UTC[+-]?\d{1,2}$/.test(abbr)) {
    return abbr.replace('UTC', 'GMT');
  }
  return abbr;
}

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
