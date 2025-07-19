import {
  formatTime,
  generateAlignedTimeSlots,
  getCurrentTimezoneAbbr,
  getTimezoneAbbrForDate,
  getTimezoneOffset,
  groupByMonth,
  formatDateForDisplay,
} from '../timeUtils';

// Mock our timezone abbreviation module
jest.mock('../timezoneAbbr', () => ({
  getCurrentTimezoneAbbr: jest.fn(() => 'EST'),
  getTimezoneAbbrForDate: jest.fn(() => 'EST'),
}));

describe('timeUtils', () => {
  const mockDate = new Date('2023-01-15T10:30:00Z');

  describe('formatTime', () => {
    it('formats time correctly', () => {
      const result = formatTime(mockDate, 'America/New_York');
      expect(result).toBe('5:30 AM');
    });
  });

  describe('new Date()', () => {
    it('returns current time', () => {
      const result = new Date();
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
      expect(slots[0]).toHaveProperty('isSelected');
      expect(slots[0]).toHaveProperty('isWeekend');
      expect(slots[0]).toHaveProperty('isMidnight');
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

  describe('getTimezoneOffset', () => {
    it('returns timezone offset', () => {
      const result = getTimezoneOffset('America/New_York');
      expect(typeof result).toBe('number');
    });
  });

  describe('groupByMonth', () => {
    it('groups dates by month correctly', () => {
      const dates = [
        new Date(Date.UTC(2023, 0, 1)),
        new Date(Date.UTC(2023, 0, 15)),
        new Date(Date.UTC(2023, 1, 1)),
        new Date(Date.UTC(2023, 1, 15)),
        new Date(Date.UTC(2023, 2, 1)),
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
      const date = new Date(Date.UTC(2023, 0, 15));
      const result = formatDateForDisplay(date);

      expect(result).toHaveProperty('day', date.getUTCDate());
      expect(result).toHaveProperty('weekday');
      expect(typeof result.weekday).toBe('string');
    });
  });
});
