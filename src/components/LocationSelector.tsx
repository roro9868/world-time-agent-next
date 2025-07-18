import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { MapPin, GripVertical } from 'lucide-react';
import cityTimezones from 'city-timezones';
import type { TimeZone } from '../types';

interface LocationSelectorProps {
  onAddLocation: (timezone: TimeZone) => void;
  existingLocations: TimeZone[];
}

// Extended TimeZone interface for search results
interface SearchTimeZone extends TimeZone {
  population?: number;
}

// Helper function to calculate timezone offset
function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const hour = localTime.getHours();
  const minute = localTime.getMinutes();
  return hour - utcHour + (minute - utcMinute) / 60;
}

// Helper function to get flag emoji from country code
function countryCodeToFlagEmoji(countryCode: string): string {
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
}

// Minimal normalization for United States
function normalizeCountryName(country: string): string {
  return country === 'United States of America' ? 'United States' : country;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  onAddLocation,
  existingLocations,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number; width: number }>({
    left: 0,
    top: 0,
    width: 320,
  });

  // Get home city (first location in the list)
  const homeCity = existingLocations[0];

  // Load city data from city-timezones library
  const allCityTz = useMemo(() => {
    if (!isFocused) return [];

    const cityData = cityTimezones.cityMapping;
    const results: SearchTimeZone[] = [];

    // Process each city entry from city-timezones
    for (const [, cityInfo] of Object.entries(cityData)) {
      if (typeof cityInfo === 'object' && cityInfo.timezone) {
        const offset = getTimezoneOffset(cityInfo.timezone);
        results.push({
          name: cityInfo.timezone,
          city: cityInfo.city,
          country: normalizeCountryName(cityInfo.country),
          offset: offset,
          flag: countryCodeToFlagEmoji(cityInfo.iso2),
          population: cityInfo.pop || 0,
        });
      }
    }

    return results;
  }, [isFocused]);

  // Filter and sort results based on search term - with better performance
  const matches = useMemo(() => {
    if (allCityTz.length === 0) return [];

    const searchLower = debouncedSearchTerm.toLowerCase();
    const filtered = allCityTz.filter((entry) => {
      const cityMatch = entry.city.toLowerCase().includes(searchLower);
      const countryMatch = entry.country.toLowerCase().includes(searchLower);
      const timezoneMatch = entry.name.toLowerCase().includes(searchLower);
      return cityMatch || countryMatch || timezoneMatch;
    });

    // Remove duplicates (same city in same timezone)
    const seen = new Set<string>();
    const unique = filtered.filter((entry) => {
      const uniqueKey = `${entry.name}:${entry.city}`;
      if (seen.has(uniqueKey)) return false;
      seen.add(uniqueKey);
      return true;
    });

    // Exclude cities already shown on the page
    const shownKeys = new Set(existingLocations.map((loc) => `${loc.name}:${loc.city}`));
    const notShown = unique.filter((entry) => !shownKeys.has(`${entry.name}:${entry.city}`));

    // Sort by relevance: exact matches first, then by population
    return notShown
      .sort((a, b) => {
        const aExact =
          a.city.toLowerCase() === searchLower || a.country.toLowerCase() === searchLower;
        const bExact =
          b.city.toLowerCase() === searchLower || b.country.toLowerCase() === searchLower;

        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        return (b.population || 0) - (a.population || 0);
      })
      .slice(0, 50); // Limit to 50 results for better performance
  }, [allCityTz, debouncedSearchTerm, existingLocations]);

  const handleSelect = useCallback(
    (tz: TimeZone) => {
      onAddLocation(tz);
      setSearchTerm('');
      setActiveIndex(0);
      setIsFocused(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    },
    [onAddLocation],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && matches.length > 0) {
        e.preventDefault();
        handleSelect(matches[activeIndex]);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, matches.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        setIsFocused(false);
        if (inputRef.current) {
          inputRef.current.blur();
        }
      }
    },
    [matches, activeIndex, handleSelect],
  );

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setNotFound(false);
  }, []);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    setTimeout(() => setIsFocused(false), 100);
  }, []);

  const handleOptionClick = useCallback(
    (entry: any) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleSelect(entry);
    },
    [handleSelect],
  );

  const handleOptionMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Update dropdown position when input is focused
  useEffect(() => {
    if (isFocused && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        left: rect.left,
        top: rect.bottom + window.scrollY,
        width: rect.width,
      });
    }
  }, [isFocused]);

  // Reset active index when search term changes
  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedSearchTerm]);

  // Show "not found" message if no results after search
  useEffect(() => {
    if (debouncedSearchTerm && matches.length === 0) {
      setNotFound(true);
    } else {
      setNotFound(false);
    }
  }, [debouncedSearchTerm, matches.length]);

  if (!homeCity) {
    return (
      <tr>
        <td className="sticky left-0 z-10 bg-white px-2 sm:px-4 py-1 sm:py-2 align-top border-r border-gray-100 min-w-[100px] whitespace-nowrap truncate">
          <div className="flex items-start space-x-1 sm:space-x-2 w-full">
            <button
              aria-hidden="true"
              className="cursor-grab p-0.5 sm:p-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none touch-none"
              disabled
              style={{ pointerEvents: 'none' }}
              tabIndex={-1}
              title="Drag handle (disabled)"
              type="button"
            >
              <GripVertical className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <MapPin className="text-lg sm:text-xl w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
            <div className="flex flex-col min-w-0 w-full">
              <div className="flex items-center min-w-0">
                <input
                  aria-activedescendant={matches.length > 0 ? `option-${activeIndex}` : undefined}
                  aria-autocomplete="list"
                  aria-controls="location-selector-dropdown"
                  aria-expanded={isFocused}
                  aria-haspopup="listbox"
                  aria-label="Search for a city to add"
                  className="w-full bg-transparent border-none outline-none text-xs sm:text-sm placeholder-gray-400"
                  onBlur={handleInputBlur}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a city..."
                  ref={inputRef}
                  role="combobox"
                  type="text"
                  value={searchTerm}
                />
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border">
      <td className="sticky left-0 z-10 bg-card px-2 xs:px-3 py-2 xs:py-3 align-top border-r border-border min-w-[120px] xs:min-w-[140px] sm:min-w-[160px] max-w-[120px] xs:max-w-[140px] sm:max-w-[160px]">
        <div className="flex items-center gap-1 xs:gap-2 w-full h-full py-1">
          <button
            aria-hidden="true"
            className="cursor-not-allowed shrink-0 h-5 xs:h-6 w-5 xs:w-6 p-0 text-muted-foreground opacity-30"
            disabled
            style={{ pointerEvents: 'none' }}
            tabIndex={-1}
            title="Drag handle (disabled)"
            type="button"
          >
            <GripVertical className="h-3 xs:h-4 w-3 xs:w-4" />
          </button>
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex items-center min-w-0 flex-1 gap-1">
            <input
              aria-activedescendant={matches.length > 0 ? `option-${activeIndex}` : undefined}
              aria-autocomplete="list"
              aria-controls="location-selector-dropdown"
              aria-expanded={isFocused}
              aria-label="Search for a city to add"
              className="flex-1 bg-transparent border border-input rounded-md px-2 py-1 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 min-w-0"
              placeholder="Add city..."
              role="combobox"
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              ref={inputRef}
            />
            <span className="px-1 py-0.5 rounded bg-teal-100 text-teal-700 text-[8px] font-medium whitespace-nowrap shrink-0">
              ADD
            </span>
          </div>
        </div>
        {isFocused &&
          ReactDOM.createPortal(
            <div
              id="location-selector-dropdown"
              className="fixed z-50 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-y-auto"
              style={{
                left: dropdownPos.left,
                top: dropdownPos.top,
                width: dropdownPos.width,
                minWidth: '320px',
              }}
              ref={dropdownRef}
            >
              {matches.length > 0 ? (
                matches.map((entry, index) => (
                  <button
                    key={`${entry.name}:${entry.city}`}
                    aria-selected={index === activeIndex}
                    className={`w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                      index === activeIndex ? 'bg-accent text-accent-foreground' : ''
                    }`}
                    id={`option-${index}`}
                    onClick={handleOptionClick(entry)}
                    onMouseDown={handleOptionMouseDown}
                    role="option"
                    type="button"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg shrink-0">{entry.flag}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {entry.city}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {entry.country} • {entry.name}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              ) : notFound ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No cities found
                </div>
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Start typing to search...
                </div>
              )}
            </div>,
            document.body,
          )}
      </td>
      <td colSpan={26} className="p-0"></td>
    </tr>
  );
};
