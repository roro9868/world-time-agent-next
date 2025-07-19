/**
 * Lightweight timezone abbreviation utility
 * Provides descriptive timezone abbreviations (EDT, BST, etc.) without moment-timezone
 */

// Common timezone abbreviations mapping for major timezones
const TIMEZONE_ABBR_MAP: Record<string, { standard: string; daylight: string }> = {
  // Americas
  'America/New_York': { standard: 'EST', daylight: 'EDT' },
  'America/Chicago': { standard: 'CST', daylight: 'CDT' },
  'America/Denver': { standard: 'MST', daylight: 'MDT' },
  'America/Los_Angeles': { standard: 'PST', daylight: 'PDT' },
  'America/Phoenix': { standard: 'MST', daylight: 'MST' }, // No DST
  'America/Anchorage': { standard: 'AKST', daylight: 'AKDT' },
  'America/Honolulu': { standard: 'HST', daylight: 'HST' }, // No DST
  'America/Toronto': { standard: 'EST', daylight: 'EDT' },
  'America/Vancouver': { standard: 'PST', daylight: 'PDT' },
  'America/Sao_Paulo': { standard: 'BRT', daylight: 'BRST' },
  
  // Europe
  'Europe/London': { standard: 'GMT', daylight: 'BST' },
  'Europe/Paris': { standard: 'CET', daylight: 'CEST' },
  'Europe/Berlin': { standard: 'CET', daylight: 'CEST' },
  'Europe/Rome': { standard: 'CET', daylight: 'CEST' },
  'Europe/Madrid': { standard: 'CET', daylight: 'CEST' },
  'Europe/Amsterdam': { standard: 'CET', daylight: 'CEST' },
  'Europe/Brussels': { standard: 'CET', daylight: 'CEST' },
  'Europe/Vienna': { standard: 'CET', daylight: 'CEST' },
  'Europe/Zurich': { standard: 'CET', daylight: 'CEST' },
  'Europe/Stockholm': { standard: 'CET', daylight: 'CEST' },
  'Europe/Oslo': { standard: 'CET', daylight: 'CEST' },
  'Europe/Copenhagen': { standard: 'CET', daylight: 'CEST' },
  'Europe/Helsinki': { standard: 'EET', daylight: 'EEST' },
  'Europe/Warsaw': { standard: 'CET', daylight: 'CEST' },
  'Europe/Prague': { standard: 'CET', daylight: 'CEST' },
  'Europe/Budapest': { standard: 'CET', daylight: 'CEST' },
  'Europe/Athens': { standard: 'EET', daylight: 'EEST' },
  'Europe/Istanbul': { standard: 'TRT', daylight: 'TRT' }, // No DST since 2016
  'Europe/Moscow': { standard: 'MSK', daylight: 'MSK' }, // No DST
  
  // Asia
  'Asia/Tokyo': { standard: 'JST', daylight: 'JST' }, // No DST
  'Asia/Shanghai': { standard: 'CST', daylight: 'CST' }, // No DST
  'Asia/Seoul': { standard: 'KST', daylight: 'KST' }, // No DST
  'Asia/Hong_Kong': { standard: 'HKT', daylight: 'HKT' }, // No DST
  'Asia/Singapore': { standard: 'SGT', daylight: 'SGT' }, // No DST
  'Asia/Bangkok': { standard: 'ICT', daylight: 'ICT' }, // No DST
  'Asia/Manila': { standard: 'PHT', daylight: 'PHT' }, // No DST
  'Asia/Jakarta': { standard: 'WIB', daylight: 'WIB' }, // No DST
  'Asia/Kolkata': { standard: 'IST', daylight: 'IST' }, // No DST
  'Asia/Dubai': { standard: 'GST', daylight: 'GST' }, // No DST
  'Asia/Riyadh': { standard: 'AST', daylight: 'AST' }, // No DST
  'Asia/Tehran': { standard: 'IRST', daylight: 'IRDT' },
  
  // Australia/Pacific
  'Australia/Sydney': { standard: 'AEST', daylight: 'AEDT' },
  'Australia/Melbourne': { standard: 'AEST', daylight: 'AEDT' },
  'Australia/Brisbane': { standard: 'AEST', daylight: 'AEST' }, // No DST
  'Australia/Perth': { standard: 'AWST', daylight: 'AWST' }, // No DST
  'Australia/Adelaide': { standard: 'ACST', daylight: 'ACDT' },
  'Pacific/Auckland': { standard: 'NZST', daylight: 'NZDT' },
  'Pacific/Fiji': { standard: 'FJT', daylight: 'FJST' },
};

/**
 * Checks if a given date is in daylight saving time for a timezone
 */
function isDaylightSavingTime(date: Date, timezone: string): boolean {
  try {
    // Get the timezone offset for January (definitely standard time)
    const jan = new Date(date.getFullYear(), 0, 1);
    const janOffset = getTimezoneOffset(jan, timezone);
    
    // Get the timezone offset for July (definitely daylight time if DST is observed)
    const jul = new Date(date.getFullYear(), 6, 1);
    const julOffset = getTimezoneOffset(jul, timezone);
    
    // If offsets are the same, timezone doesn't observe DST
    if (janOffset === julOffset) {
      return false;
    }
    
    // Get current offset
    const currentOffset = getTimezoneOffset(date, timezone);
    
    // DST is when offset is different from standard time (January)
    // In northern hemisphere, DST offset is greater than standard
    // In southern hemisphere, DST offset is less than standard
    return currentOffset !== janOffset;
  } catch {
    return false;
  }
}

/**
 * Gets timezone offset in minutes for a specific date and timezone
 */
function getTimezoneOffset(date: Date, timezone: string): number {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
  } catch {
    return 0;
  }
}

/**
 * Formats a numeric offset as GMT+X or GMT-X
 */
function formatGMTOffset(offsetMinutes: number): string {
  const hours = Math.abs(Math.floor(offsetMinutes / 60));
  const minutes = Math.abs(offsetMinutes % 60);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  
  if (minutes === 0) {
    return `GMT${sign}${hours}`;
  } else {
    return `GMT${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
  }
}

/**
 * Gets timezone abbreviation for current time
 */
export function getCurrentTimezoneAbbr(timezone: string): string {
  return getTimezoneAbbrForDate(new Date(), timezone);
}

/**
 * Gets timezone abbreviation for a specific date
 */
export function getTimezoneAbbrForDate(date: Date, timezone: string): string {
  try {
    // Check if we have a mapping for this timezone
    const mapping = TIMEZONE_ABBR_MAP[timezone];
    if (mapping) {
      const isDST = isDaylightSavingTime(date, timezone);
      return isDST ? mapping.daylight : mapping.standard;
    }
    
    // Try to get abbreviation using Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    
    const parts = formatter.formatToParts(date);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    
    if (timeZonePart && timeZonePart.value) {
      const abbr = timeZonePart.value;
      
      // If it's a numeric offset (like GMT+8), keep it as is
      if (/^GMT[+-]\d+/.test(abbr)) {
        return abbr;
      }
      
      // If it's not a numeric offset and not too long, use it
      if (abbr.length <= 5 && !/^[+-]\d/.test(abbr)) {
        return abbr;
      }
    }
    
    // Fallback: calculate and format GMT offset
    const offsetMinutes = getTimezoneOffset(date, timezone);
    return formatGMTOffset(offsetMinutes);
  } catch {
    // Final fallback
    return 'GMT';
  }
}