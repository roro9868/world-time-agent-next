import { groupByMonth, formatDateForDisplay } from '../timeUtils';

describe('ranges', () => {
  it('groups dates by month', () => {
    const dates = [
      new Date('2023-01-01T00:00:00Z'),
      new Date('2023-01-15T00:00:00Z'),
      new Date('2023-02-01T00:00:00Z'),
      new Date('2023-02-15T00:00:00Z'),
      new Date('2023-03-01T00:00:00Z'),
    ];
    const groups = groupByMonth(dates);
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
