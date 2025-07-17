import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeZoneRow from '../TimeZoneRow';
import { Location, TimeZone } from '../../types';

// Mock the timeUtils functions
jest.mock('../../utils/timeUtils', () => ({
  getTimezoneAbbrForDate: jest.fn(() => 'EST'),
  formatCurrentTimeInZone: jest.fn(() => '12:00 PM'),
}));

// Mock the TimeSlotCell component
jest.mock('../TimeSlotCell', () => {
  return function MockTimeSlotCell({ colIdx }: { colIdx: number }) {
    return <div data-testid={`time-slot-${colIdx}`}>Time Slot {colIdx}</div>;
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
};

describe('TimeZoneRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders location information correctly', () => {
    render(
      <table><tbody><TimeZoneRow {...defaultProps} /></tbody></table>
    );
    
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    expect(screen.getByText('EST')).toBeInTheDocument();
  });

  it('renders time slots correctly', () => {
    render(
      <table><tbody><TimeZoneRow {...defaultProps} /></tbody></table>
    );
    
    expect(screen.getByTestId('time-slot-0')).toBeInTheDocument();
    expect(screen.getByTestId('time-slot-1')).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = jest.fn();
    render(<TimeZoneRow {...defaultProps} onRemove={onRemove} />);
    
    const removeButton = screen.getByLabelText('Remove New York from list');
    fireEvent.click(removeButton);
    
    expect(onRemove).toHaveBeenCalledWith('new-york');
  });

  it('calls onTimeSlotClick when time slot is clicked', () => {
    const onTimeSlotClick = jest.fn();
    render(<TimeZoneRow {...defaultProps} onTimeSlotClick={onTimeSlotClick} />);
    
    const timeSlot = screen.getByTestId('time-slot-0');
    fireEvent.click(timeSlot);
    
    expect(onTimeSlotClick).toHaveBeenCalledWith(0);
  });

  it('applies home row styling when isHome is true', () => {
    render(
      <table><tbody><TimeZoneRow {...defaultProps} isHome={true} /></tbody></table>
    );
    
    const row = screen.getByRole('row');
    expect(row).toHaveClass('bg-primary-200', 'border-l-8', 'border-l-primary-600', 'shadow-md');
  });

  it('applies home row styling when timezone matches homeTimezone', () => {
    render(<TimeZoneRow {...defaultProps} homeTimezone="America/New_York" />);
    
    const row = screen.getByRole('row');
    expect(row).toHaveClass('bg-primary-200', 'border-l-8', 'border-l-primary-600', 'shadow-md');
  });

  it('has proper accessibility attributes', () => {
    render(<TimeZoneRow {...defaultProps} />);
    
    const row = screen.getByRole('row');
    expect(row).toHaveAttribute('aria-label', 'Time zone row for New York');
    
    const removeButton = screen.getByLabelText('Remove New York from list');
    expect(removeButton).toBeInTheDocument();
    
    const flag = screen.getByRole('img');
    expect(flag).toHaveAttribute('aria-label', 'Flag of United States');
  });

  it('handles keyboard navigation for remove button', () => {
    const onRemove = jest.fn();
    render(<TimeZoneRow {...defaultProps} onRemove={onRemove} />);
    
    const removeButton = screen.getByLabelText('Remove New York from list');
    
    // Focus the button
    removeButton.focus();
    expect(removeButton).toHaveFocus();
    
    // Press Enter to remove
    fireEvent.keyDown(removeButton, { key: 'Enter' });
    expect(onRemove).toHaveBeenCalledWith('new-york');
  });

  it('renders drag handle with proper accessibility', () => {
    render(
      <table><tbody><TimeZoneRow {...defaultProps} /></tbody></table>
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
    
    render(<TimeZoneRow {...defaultProps} location={longCityLocation} />);
    
    const cityName = screen.getByText('Very Long City Name That Should Be Truncated');
    expect(cityName).toHaveClass('truncate');
  });

  it('handles empty time slots gracefully', () => {
    const emptyLocation = {
      ...mockLocation,
      timeSlots: [],
    };
    
    render(<TimeZoneRow {...defaultProps} location={emptyLocation} />);
    
    // Should still render the header cell
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
  });
}); 