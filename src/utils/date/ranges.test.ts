import { generateDateRange, groupByMonth, formatDateForDisplay } from './ranges';

describe('ranges', () => {
  it('generates a date range', () => {
    const start = new Date('2023-01-01T00:00:00Z');
    const range = generateDateRange(start, 5);
    expect(range.length).toBe(5);
    expect(range[0]).toBeInstanceOf(Date);
  });

  it('groups dates by month', () => {
    const start = new Date('2023-01-01T00:00:00Z');
    const range = generateDateRange(start, 40);
    const groups = groupByMonth(range);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0]).toHaveProperty('month');
    expect(groups[0]).toHaveProperty('start');
    expect(groups[0]).toHaveProperty('end');
  });

  it('formats date for display', () => {
    const date = new Date('2023-01-01T00:00:00Z');
    const formatted = formatDateForDisplay(date);
    expect(typeof formatted.day).toBe('number');
    expect(typeof formatted.weekday).toBe('string');
  });
}); 