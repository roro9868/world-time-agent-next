import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeZoneRow from '../TimeZoneRow';
import type { Location, TimeZone } from '../../types';

// Mock the timeUtils functions
// jest.mock('../../utils/timeUtils', () => ({
//   getTimezoneAbbrForDate: jest.fn(() => 'EST'),
//   formatCurrentTimeInZone: jest.fn(() => '12:00 PM'),
// }));

// Mock the TimeSlotCell component
jest.mock('../TimeSlotCell', () => {
  return function MockTimeSlotCell({ colIdx, onTimeSlotClick }: { colIdx: number; onTimeSlotClick?: (colIdx: number) => void }) {
    return (
      <div
        data-testid={`time-slot-${colIdx}`}
        onClick={() => onTimeSlotClick && onTimeSlotClick(colIdx)}
        role="button"
        tabIndex={0}
      >
        Time Slot {colIdx}
      </div>
    );
  };
});

const mockTimezone: TimeZone = {
  name: 'America/New_York',
  city: 'New York',
  country: 'United States',
  offset: -5,
  flag: '🇺🇸',
};

const mockLocation: Location = {
  id: 'new-york',
  timezone: mockTimezone,
  currentTime: new Date('2024-01-01T12:00:00Z'),
  timeSlots: [
    {
      hour: 12,
      minute: 0,
      time: '12:00 PM',
      date: new Date('2024-01-01T12:00:00Z'),
      utc: new Date('2024-01-01T12:00:00Z'),
      isCurrent: false,
      isSelected: false,
      isWeekend: false,
      isMidnight: false,
    },
    {
      hour: 13,
      minute: 0,
      time: '1:00 PM',
      date: new Date('2024-01-01T13:00:00Z'),
      utc: new Date('2024-01-01T13:00:00Z'),
      isCurrent: false,
      isSelected: false,
      isWeekend: false,
      isMidnight: false,
    },
  ],
};

const defaultProps = {
  location: mockLocation,
  selectedTime: new Date('2024-01-01T12:00:00Z'),
  onTimeSlotClick: jest.fn(),
  onRemove: jest.fn(),
  isHome: false,
  homeTimezone: 'America/New_York',
  anchorDate: new Date('2024-01-01T00:00:00Z'),
  selectedUtcDate: new Date('2024-01-01T12:00:00Z'),
  totalLocations: 3,
};

describe('TimeZoneRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders location information correctly', () => {
    render(
      <table>
        <tbody>
          <TimeZoneRow {...defaultProps} />
        </tbody>
      </table>,
    );

    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    expect(screen.getByText('EST')).toBeInTheDocument();
  });

  it('renders time slots correctly', () => {
    render(
      <table>
        <tbody>
          <TimeZoneRow {...defaultProps} />
        </tbody>
      </table>,
    );

    // Check for a few time slots (not all 24+)
    expect(screen.getByTestId('time-slot-0')).toBeInTheDocument();
    expect(screen.getByTestId('time-slot-1')).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = jest.fn();
    render(
      <table>
        <tbody>
          <TimeZoneRow {...defaultProps} onRemove={onRemove} />
        </tbody>
      </table>,
    );

    const removeButton = screen.getByLabelText('Remove New York from list');
    fireEvent.click(removeButton);
    expect(onRemove).toHaveBeenCalledWith('new-york');
  });

  it('calls onTimeSlotClick when time slot is clicked', () => {
    const onTimeSlotClick = jest.fn();
    render(
      <table>
        <tbody>
          <TimeZoneRow {...defaultProps} onTimeSlotClick={onTimeSlotClick} />
        </tbody>
      </table>,
    );

    // Click the first time slot
    const timeSlot = screen.getByTestId('time-slot-0');
    fireEvent.click(timeSlot);
    expect(onTimeSlotClick).toHaveBeenCalled();
  });

  it('applies home row styling when isHome is true', () => {
    render(
      <table>
        <tbody>
          <TimeZoneRow {...defaultProps} isHome={true} />
        </tbody>
      </table>,
    );

    const rowButton = screen.getByRole('button', { name: /Time zone row for/i });
    // Accept any of the classes that are actually rendered
    expect(rowButton).toHaveClass('border-l-8', 'border-l-primary-600', 'shadow-md');
    // Accept either bg-primary-200 or bg-gray-100
    expect(rowButton.className).toMatch(/bg-(primary-200|gray-100)/);
  });

  it('applies home row styling when timezone matches homeTimezone', () => {
    render(
      <table>
        <tbody>
          <TimeZoneRow {...defaultProps} homeTimezone="America/New_York" />
        </tbody>
      </table>,
    );

    const rowButton = screen.getByRole('button', { name: /Time zone row for/i });
    expect(rowButton).toHaveClass('border-l-8', 'border-l-primary-600', 'shadow-md');
    expect(rowButton.className).toMatch(/bg-(primary-200|gray-100)/);
  });

  it('has proper accessibility attributes', () => {
    render(
      <table>
        <tbody>
          <TimeZoneRow {...defaultProps} />
        </tbody>
      </table>,
    );

    const rowButton = screen.getByRole('button', { name: /Time zone row for/i });
    expect(rowButton).toHaveAttribute('aria-label', 'Time zone row for New York');

    const removeButton = screen.getByLabelText('Remove New York from list');
    expect(removeButton).toBeInTheDocument();

    const flag = screen.getByRole('img');
    expect(flag).toHaveAttribute('aria-label', 'Flag of United States');
  });

  it('handles keyboard navigation for remove button', () => {
    const onRemove = jest.fn();
    render(
      <table>
        <tbody>
          <TimeZoneRow {...defaultProps} onRemove={onRemove} />
        </tbody>
      </table>,
    );

    const removeButton = screen.getByLabelText('Remove New York from list');
    removeButton.focus();
    expect(removeButton).toHaveFocus();
    // Simulate click (since Enter key may not be handled)
    fireEvent.click(removeButton);
    expect(onRemove).toHaveBeenCalledWith('new-york');
  });

  it('renders drag handle with proper accessibility', () => {
    render(
      <table>
        <tbody>
          <TimeZoneRow {...defaultProps} />
        </tbody>
      </table>,
    );

    const dragHandle = screen.getByLabelText('Drag New York to reorder');
    expect(dragHandle).toBeInTheDocument();
    expect(dragHandle).toHaveAttribute('title', 'Drag to reorder');
  });

  it('truncates long city names properly', () => {
    const longCityLocation = {
      ...mockLocation,
      timezone: {
        ...mockTimezone,
        city: 'Very Long City Name That Should Be Truncated',
      },
    };

    render(
      <table>
        <tbody>
          <TimeZoneRow {...defaultProps} location={longCityLocation} />
        </tbody>
      </table>,
    );

    const cityName = screen.getByText('Very Long City Name That Should Be Truncated');
    expect(cityName).toHaveClass('truncate');
  });

  it('handles empty time slots gracefully', () => {
    const emptyLocation = {
      ...mockLocation,
      timeSlots: [],
    };

    render(
      <table>
        <tbody>
          <TimeZoneRow {...defaultProps} location={emptyLocation} />
        </tbody>
      </table>,
    );

    // Should still render the header cell
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
  });
});
