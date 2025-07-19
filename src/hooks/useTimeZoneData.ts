import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Location, TimeZone } from '../types';
import { generateAlignedTimeSlots, getTimezoneOffset } from '../utils/timeUtils';
import cityTimezones from 'city-timezones';
import { toZonedTime } from 'date-fns-tz';

interface UseTimeZoneDataReturn {
  locations: Location[];
  selectedTime: Date;
  selectedUtcDate: Date | null;
  anchorDate: Date;
  homeTimezone: string;
  addLocation: (timezone: TimeZone) => void;
  removeLocation: (id: string) => void;
  setSelectedTime: (time: Date) => void;
  setSelectedUtcDate: (date: Date | null) => void;
  setAnchorDate: (date: Date) => void;
  updateLocations: (locations: Location[]) => void;
}

// Minimal normalization for United States
function normalizeCountryName(country: string): string {
  return country === 'United States of America' ? 'United States' : country;
}

export const useTimeZoneData = (): UseTimeZoneDataReturn => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [selectedUtcDate, setSelectedUtcDate] = useState<Date | null>(null);
  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  // Memoize homeTimezone for performance
  const homeTimezone = useMemo(
    () => locations[0]?.timezone.name || Intl.DateTimeFormat().resolvedOptions().timeZone,
    [locations],
  );

  // Helper to get a Date object for midnight in the home timezone (timezone-aware, robust polyfill for zonedTimeToUtc)
  const getHomeMidnightDate = useCallback((date: Date, homeTimezone: string) => {
    const zoned = toZonedTime(date, homeTimezone);
    const year = zoned.getFullYear();
    const month = zoned.getMonth();
    const day = zoned.getDate();
    const utcMidnight = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const offsetMinutes = -toZonedTime(utcMidnight, homeTimezone).getTimezoneOffset();
    return new Date(utcMidnight.getTime() - offsetMinutes * 60 * 1000);
  }, []);

  // Initialize default locations
  useEffect(() => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Define default cities by timezone and city name
    const defaultCityKeys = [
      { timezone: 'America/New_York', city: 'New York' },
      { timezone: 'Europe/London', city: 'London' },
      { timezone: 'Asia/Tokyo', city: 'Tokyo' },
      { timezone: 'Asia/Shanghai', city: 'Shanghai' },
      { timezone: 'America/Los_Angeles', city: 'Los Angeles' },
      { timezone: 'Europe/Istanbul', city: 'Istanbul' },
      { timezone: 'Asia/Kolkata', city: 'Mumbai' },
    ];

    const baseTime = getHomeMidnightDate(new Date(), userTimezone);
    
    const homeSlots = generateAlignedTimeSlots(baseTime, userTimezone, userTimezone, 0);
    const initialUtc = homeSlots[0].utc;
    
    // Helper function to get flag emoji from country code
    const countryCodeToFlagEmoji = (countryCode: string): string => {
      if (!countryCode || countryCode.length !== 2) return '🌍';
      try {
        const codePoints = countryCode
          .toUpperCase()
          .split('')
          .map((char) => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
      } catch {
        return '🌍';
      }
    };


    // Get default locations from city-timezones library
    const defaultLocations = defaultCityKeys
      .filter((dc) => dc.timezone !== userTimezone)
      .map((dc) => {
        // Find the city in the city-timezones library
        interface CityInfo {
          timezone: string;
          city: string;
          country: string;
          iso2: string;
          pop?: number;
        }
        
        const cityInfo = Object.values(cityTimezones.cityMapping).find(
          (info: CityInfo) => info.timezone === dc.timezone && info.city === dc.city,
        );

        if (!cityInfo) {
          console.warn(`City not found in library: ${dc.city}, ${dc.timezone}`);
          return null;
        }

        const city: TimeZone = {
          name: cityInfo.timezone,
          city: cityInfo.city,
          country: normalizeCountryName(cityInfo.country), // Use library's country name directly
          offset: getTimezoneOffset(cityInfo.timezone),
          flag: countryCodeToFlagEmoji(cityInfo.iso2),
        };

        return {
          id: city.name + ':' + city.city,
          timezone: city,
          currentTime: new Date(),
          timeSlots: generateAlignedTimeSlots(
            baseTime,
            userTimezone,
            city.name,
            0,
          ),
        };
      })
      .filter(Boolean) as Location[]; // Remove any null entries

    // Find local timezone info with priority for major cities
    const priorityCities = {
      'America/New_York': 'New York',
      'America/Los_Angeles': 'Los Angeles',
      'America/Chicago': 'Chicago',
      'America/Denver': 'Denver',
      'America/Phoenix': 'Phoenix',
      'America/Anchorage': 'Anchorage',
      'America/Honolulu': 'Honolulu',
      'Europe/London': 'London',
      'Europe/Paris': 'Paris',
      'Europe/Berlin': 'Berlin',
      'Europe/Rome': 'Rome',
      'Europe/Madrid': 'Madrid',
      'Europe/Amsterdam': 'Amsterdam',
      'Europe/Brussels': 'Brussels',
      'Europe/Vienna': 'Vienna',
      'Europe/Zurich': 'Zurich',
      'Europe/Stockholm': 'Stockholm',
      'Europe/Oslo': 'Oslo',
      'Europe/Copenhagen': 'Copenhagen',
      'Europe/Helsinki': 'Helsinki',
      'Europe/Warsaw': 'Warsaw',
      'Europe/Prague': 'Prague',
      'Europe/Budapest': 'Budapest',
      'Europe/Athens': 'Athens',
      'Europe/Istanbul': 'Istanbul',
      'Europe/Moscow': 'Moscow',
      'Asia/Tokyo': 'Tokyo',
      'Asia/Shanghai': 'Shanghai',
      'Asia/Seoul': 'Seoul',
      'Asia/Beijing': 'Beijing',
      'Asia/Hong_Kong': 'Hong Kong',
      'Asia/Singapore': 'Singapore',
      'Asia/Bangkok': 'Bangkok',
      'Asia/Manila': 'Manila',
      'Asia/Jakarta': 'Jakarta',
      'Asia/Kolkata': 'Mumbai',
      'Asia/Dhaka': 'Dhaka',
      'Asia/Karachi': 'Karachi',
      'Asia/Dubai': 'Dubai',
      'Asia/Tel_Aviv': 'Tel Aviv',
      'Asia/Riyadh': 'Riyadh',
      'Asia/Baghdad': 'Baghdad',
      'Asia/Tehran': 'Tehran',
      'Australia/Sydney': 'Sydney',
      'Australia/Melbourne': 'Melbourne',
      'Australia/Brisbane': 'Brisbane',
      'Australia/Perth': 'Perth',
      'Australia/Adelaide': 'Adelaide',
      'Pacific/Auckland': 'Auckland',
      'Pacific/Fiji': 'Suva',
    };

    interface CityTimezoneInfo {
      timezone: string;
      city: string;
      country: string;
      iso2: string;
      pop?: number;
    }
    
    let localCityInfo = Object.values(cityTimezones.cityMapping).find(
      (info: CityTimezoneInfo) =>
        info.timezone === userTimezone &&
        info.city === priorityCities[userTimezone as keyof typeof priorityCities],
    );

    // If not a priority city, default to New York
    if (!localCityInfo) {
      localCityInfo = Object.values(cityTimezones.cityMapping).find(
        (info: CityTimezoneInfo) => info.timezone === 'America/New_York' && info.city === 'New York',
      );
    }

    const localTimezone: TimeZone = localCityInfo
      ? {
          name: localCityInfo.timezone,
          city: localCityInfo.city,
          country: normalizeCountryName(localCityInfo.country),
          offset: getTimezoneOffset(userTimezone),
          flag: countryCodeToFlagEmoji(localCityInfo.iso2),
        }
      : {
          name: userTimezone,
          city: 'New York', // Default to New York if no city found
          country: 'United States',
          offset: getTimezoneOffset(userTimezone),
          flag: '🇺🇸',
        };

    const initialLocation: Location = {
      id: 'local',
      timezone: localTimezone,
      currentTime: new Date(),
      timeSlots: generateAlignedTimeSlots(
        baseTime,
        userTimezone,
        userTimezone,
        0,
      ),
    };

    setLocations([initialLocation, ...defaultLocations]);
    setSelectedTime(baseTime);
    setAnchorDate(baseTime);
    setSelectedUtcDate(initialUtc);
    // Note: selectedColumnIndex will be set to 0 by default in the page component
  }, [getHomeMidnightDate]);

  // Update currentTime for all locations every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setLocations((prev) =>
        prev.map((location) => ({
          ...location,
          currentTime: new Date(),
        })),
      );
    }, 60 * 1000);

    // Also update immediately on mount
    setLocations((prev) =>
      prev.map((location) => ({
        ...location,
        currentTime: new Date(),
      })),
    );

    return () => clearInterval(interval);
  }, []);

  const addLocation = useCallback(
    (timezone: TimeZone) => {
      setLocations((prev) => {
        if (
          prev.some(
            (location) =>
              location.timezone.name === timezone.name && location.timezone.city === timezone.city,
          )
        ) {
          return prev; // Don't add if already exists
        }
        return [
          ...prev,
          {
            id: `${timezone.name}:${timezone.city}`,
            timezone,
            currentTime: new Date(),
            timeSlots: generateAlignedTimeSlots(
              selectedTime,
              homeTimezone,
              timezone.name,
              0,
            ),
          },
        ];
      });
    },
    [selectedTime, homeTimezone],
  );

  const removeLocation = useCallback((id: string) => {
    setLocations((prev) => {
      // If there's only one location, don't remove it
      if (prev.length <= 1) {
        return prev;
      }

      const locationIndex = prev.findIndex((location) => location.id === id);
      if (locationIndex === -1) {
        return prev; // Location not found
      }

      // If removing the home city (first in the list), ensure the next city becomes home
      if (locationIndex === 0 && prev.length > 1) {
        const newLocations = prev.filter((location) => location.id !== id);
        // Update the new home city's ID to 'local' to maintain consistency
        newLocations[0] = { ...newLocations[0], id: 'local' };
        return newLocations;
      }

      // For non-home cities, just filter them out
      return prev.filter((location) => location.id !== id);
    });
  }, []);

  const updateLocations = useCallback((newLocations: Location[]) => {
    setLocations(newLocations);
  }, []);

  return {
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
  };
};
