import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// Use only the IANA time zone name
// Returns the current time in the given timezone as a Date object
export const getCurrentTimeInZone = (timeZone: string): Date => {
  // Always return the current UTC time; formatting will handle the zone
  return new Date();
};

// Converts a wall clock time in fromZone to the corresponding wall clock time in toZone
export const convertTimeToZone = (date: Date, fromZone: string, toZone: string): Date => {
  const utcDate = fromZonedTime(date, fromZone);
  return toZonedTime(utcDate, toZone);
};

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