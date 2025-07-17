import { renderHook, act } from '@testing-library/react';
import { useTimeZoneData } from '../useTimeZoneData';

describe('useTimeZoneData', () => {
  it('should initialize with default locations', () => {
    const { result } = renderHook(() => useTimeZoneData());
    expect(result.current.locations.length).toBeGreaterThan(0);
    expect(result.current.selectedTime).toBeInstanceOf(Date);
    expect(result.current.anchorDate).toBeInstanceOf(Date);
  });

  it('should add and remove locations', () => {
    const { result } = renderHook(() => useTimeZoneData());
    const initialCount = result.current.locations.length;
    const newTz = {
      name: 'Europe/Paris',
      city: 'Paris',
      country: 'France',
      offset: 1,
      flag: '🇫🇷',
    };
    act(() => {
      result.current.addLocation(newTz);
    });
    expect(result.current.locations.length).toBe(initialCount + 1);
    const newLoc = result.current.locations.find(l => l.timezone.name === 'Europe/Paris');
    expect(newLoc).toBeDefined();
    act(() => {
      result.current.removeLocation(newLoc!.id);
    });
    expect(result.current.locations.length).toBe(initialCount);
  });
}); 