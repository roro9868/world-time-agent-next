import {
  formatTime,
  getCurrentTimeInZone,
  convertTimeToZone,
  generateAlignedTimeSlots,
  getCurrentTimezoneAbbr,
  getTimezoneAbbrForDate,
  getCurrentTimezoneOffset,
  getSlotBgColor,
  generateDateRange,
  groupByMonth,
  formatDateForDisplay,
} from '../timeUtils';

// Mock moment-timezone
jest.mock('moment-timezone', () => ({
  tz: jest.fn(() => ({
    zoneAbbr: jest.fn(() => 'EST'),
  })),
}));

describe('timeUtils', () => {
  const mockDate = new Date('2023-01-15T10:30:00Z');

  describe('formatTime', () => {
    it('formats time correctly', () => {
      const result = formatTime(mockDate, 'America/New_York');
      expect(result).toBe('5:30 AM');
    });
  });

  describe('getCurrentTimeInZone', () => {
    it('returns current time', () => {
      const result = getCurrentTimeInZone('America/New_York');
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('convertTimeToZone', () => {
    it('converts time between zones', () => {
      const result = convertTimeToZone(mockDate, 'America/New_York', 'Europe/London');
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('generateAlignedTimeSlots', () => {
    it('generates time slots correctly', () => {
      const baseDate = new Date('2023-01-15');
      const slots = generateAlignedTimeSlots(baseDate, 'America/New_York', 'Europe/London');

      expect(slots).toBeInstanceOf(Array);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toHaveProperty('hour');
      expect(slots[0]).toHaveProperty('minute');
      expect(slots[0]).toHaveProperty('time');
      expect(slots[0]).toHaveProperty('date');
      expect(slots[0]).toHaveProperty('utc');
      expect(slots[0]).toHaveProperty('isCurrent');
      expect(slots[0]).toHaveProperty('isSelected');
      expect(slots[0]).toHaveProperty('isWeekend');
    });
  });

  describe('getCurrentTimezoneAbbr', () => {
    it('returns timezone abbreviation', () => {
      const result = getCurrentTimezoneAbbr('America/New_York');
      expect(result).toBe('EST');
    });
  });

  describe('getTimezoneAbbrForDate', () => {
    it('returns timezone abbreviation for specific date', () => {
      const result = getTimezoneAbbrForDate(mockDate, 'America/New_York');
      expect(result).toBe('EST');
    });
  });

  describe('getCurrentTimezoneOffset', () => {
    it('returns timezone offset', () => {
      const result = getCurrentTimezoneOffset('America/New_York');
      expect(typeof result).toBe('number');
    });
  });

  describe('getSlotBgColor', () => {
    it('returns correct background color for daytime', () => {
      expect(getSlotBgColor(12, 0)).toBe('bg-amber-50'); // Noon
      expect(getSlotBgColor(8, 0)).toBe('bg-amber-50'); // 8 AM
      expect(getSlotBgColor(18, 0)).toBe('bg-amber-50'); // 6 PM
    });

    it('returns correct background color for nighttime', () => {
      expect(getSlotBgColor(0, 0)).toBe('bg-blue-50'); // Midnight
      expect(getSlotBgColor(6, 0)).toBe('bg-blue-50'); // 6 AM
      expect(getSlotBgColor(22, 0)).toBe('bg-blue-50'); // 10 PM
    });
  });

  describe('generateDateRange', () => {
    it('generates correct date range', () => {
      const startDate = new Date('2023-01-01');
      const dates = generateDateRange(startDate, 5);

      expect(dates).toHaveLength(5);
      expect(dates[0].toDateString()).toBe('Sun Jan 01 2023');
      expect(dates[4].toDateString()).toBe('Thu Jan 05 2023');
    });
  });

  describe('groupByMonth', () => {
    it('groups dates by month correctly', () => {
      const dates = [
        new Date('2023-01-01'),
        new Date('2023-01-15'),
        new Date('2023-02-01'),
        new Date('2023-02-15'),
        new Date('2023-03-01'),
      ];

      const groups = groupByMonth(dates);

      expect(groups).toHaveLength(3);
      expect(groups[0].month).toBe('Jan');
      expect(groups[0].start).toBe(0);
      expect(groups[0].end).toBe(1);
      expect(groups[1].month).toBe('Feb');
      expect(groups[1].start).toBe(2);
      expect(groups[1].end).toBe(3);
      expect(groups[2].month).toBe('Mar');
      expect(groups[2].start).toBe(4);
      expect(groups[2].end).toBe(4);
    });
  });

  describe('formatDateForDisplay', () => {
    it('formats date for display correctly', () => {
      const result = formatDateForDisplay(new Date('2023-01-15'));

      expect(result).toHaveProperty('day', 15);
      expect(result).toHaveProperty('weekday');
      expect(typeof result.weekday).toBe('string');
    });
  });
});
