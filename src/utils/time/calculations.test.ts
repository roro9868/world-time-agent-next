import {
  getTimezoneOffset,
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
});