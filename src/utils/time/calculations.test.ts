import { getCurrentTimeInZone, convertTimeToZone, getCurrentTimezoneOffset, getSlotBgColor } from './calculations';

describe('calculations', () => {
  it('gets current time in zone', () => {
    const date = getCurrentTimeInZone('UTC');
    expect(date).toBeInstanceOf(Date);
  });

  it('converts time between zones', () => {
    const date = new Date('2023-01-01T12:00:00Z');
    const converted = convertTimeToZone(date, 'UTC', 'America/New_York');
    expect(converted).toBeInstanceOf(Date);
  });

  it('gets current timezone offset', () => {
    const offset = getCurrentTimezoneOffset('UTC');
    expect(typeof offset).toBe('number');
  });

  it('gets slot background color', () => {
    expect(getSlotBgColor(8, 0)).toBe('bg-amber-50');
    expect(getSlotBgColor(2, 0)).toBe('bg-blue-50');
  });
}); 