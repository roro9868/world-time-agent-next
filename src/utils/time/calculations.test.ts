import {
  getTimezoneOffset,
  getSlotBgColor,
} from '../timeUtils';

describe('calculations', () => {
  it('gets current time as Date object', () => {
    const date = new Date();
    expect(date).toBeInstanceOf(Date);
  });

  it('gets current timezone offset', () => {
    const offset = getTimezoneOffset('UTC');
    expect(typeof offset).toBe('number');
  });

  it('gets slot background color', () => {
    expect(getSlotBgColor(8, 0)).toBe('bg-amber-50');
    expect(getSlotBgColor(2, 0)).toBe('bg-blue-50');
  });
});