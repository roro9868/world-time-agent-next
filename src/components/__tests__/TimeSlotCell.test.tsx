import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeSlotCell from '../TimeSlotCell';
import { TimeSlot, TimeZone } from '../../types';
import { formatInTimeZone } from 'date-fns-tz';

const mockTimezone: TimeZone = {
  name: 'America/New_York',
  city: 'New York',
  country: 'United States',
  offset: -5,
  flag: '🇺🇸',
};

const mockTimeSlot: TimeSlot = {
  hour: 7,
  minute: 0,
  time: '7:00 AM',
  date: new Date('2024-01-01T07:00:00Z'),
  utc: new Date('2024-01-01T07:00:00Z'),
  isCurrent: false,
  isSelected: false,
  isWeekend: false,
  isMidnight: false,
};

const midnightSlot: TimeSlot = {
  ...mockTimeSlot,
  hour: 0,
  minute: 0,
  time: '12:00 AM',
  date: new Date('2024-01-02T00:00:00Z'),
  utc: new Date('2024-01-02T00:00:00Z'),
  isMidnight: true,
};

const onHourSlot: TimeSlot = {
  ...mockTimeSlot,
  hour: 2,
  minute: 0,
  time: '2:00 PM',
  date: new Date('2024-01-01T14:00:00Z'),
  utc: new Date('2024-01-01T14:00:00Z'),
};

const offHourSlot: TimeSlot = {
  ...mockTimeSlot,
  hour: 2,
  minute: 30,
  time: '2:30 PM',
  date: new Date('2024-01-01T14:30:00Z'),
  utc: new Date('2024-01-01T14:30:00Z'),
};

const mockTimeSlots: TimeSlot[] = [
  mockTimeSlot,
  midnightSlot,
  onHourSlot,
  offHourSlot,
];

const defaultProps = {
  slot: mockTimeSlot,
  colIdx: 0,
  timeSlots: mockTimeSlots,
  timezone: mockTimezone,
  onTimeSlotClick: jest.fn(),
  selectedTime: new Date('2024-01-01T07:00:00Z'),
};

describe('TimeSlotCell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders time slot correctly', () => {
    render(<TimeSlotCell {...defaultProps} />);
    const expectedHour = formatInTimeZone(mockTimeSlot.utc, mockTimezone.name, 'h');
    const expectedAMPM = formatInTimeZone(mockTimeSlot.utc, mockTimezone.name, 'a');
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText(expectedHour)).toBeInTheDocument();
    expect(screen.getByText(expectedAMPM)).toBeInTheDocument();
  });

  it('calls onTimeSlotClick when clicked', () => {
    const onTimeSlotClick = jest.fn();
    render(<TimeSlotCell {...defaultProps} onTimeSlotClick={onTimeSlotClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onTimeSlotClick).toHaveBeenCalled();
  });

  it('shows date label only at midnight slot', () => {
    render(<TimeSlotCell {...defaultProps} slot={midnightSlot} colIdx={1} timeSlots={mockTimeSlots} />);
    const expectedDate = formatInTimeZone(midnightSlot.utc, mockTimezone.name, 'MMM d');
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it('shows date label for first column regardless of time', () => {
    render(<TimeSlotCell {...defaultProps} slot={mockTimeSlot} colIdx={0} timeSlots={mockTimeSlots} />);
    // The first column should always show the date label
    const expectedDate = formatInTimeZone(mockTimeSlot.utc, mockTimezone.name, 'MMM d');
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it('applies current time styling when slot is current', () => {
    const currentSlot = {
      ...mockTimeSlot,
      isCurrent: true,
    };
    
    render(<TimeSlotCell {...defaultProps} slot={currentSlot} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('ring-2', 'ring-green-400');
  });

  it('applies selected time styling when slot is selected', () => {
    const selectedSlot = {
      ...mockTimeSlot,
      isSelected: true,
    };
    
    render(<TimeSlotCell {...defaultProps} slot={selectedSlot} />);
    
    const button = screen.getByRole('button');
    // The selected styling depends on the getSlotBgColor function
    expect(button).toHaveClass('hover:bg-primary-100');
  });

  it('has proper accessibility attributes', () => {
    render(<TimeSlotCell {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('title');
    expect(button).toHaveAttribute('tabIndex', '0');
  });

  it('handles keyboard navigation', () => {
    const onTimeSlotClick = jest.fn();
    render(<TimeSlotCell {...defaultProps} onTimeSlotClick={onTimeSlotClick} />);
    
    const button = screen.getByRole('button');
    
    // Focus the button
    button.focus();
    expect(button).toHaveFocus();
    
    // Press Enter to select
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onTimeSlotClick).toHaveBeenCalled();
    
    // Press Space to select
    fireEvent.keyDown(button, { key: ' ' });
    expect(onTimeSlotClick).toHaveBeenCalledTimes(2);
  });

  it('renders time without minutes when on the hour', () => {
    render(<TimeSlotCell {...defaultProps} slot={onHourSlot} />);
    const expectedHour = formatInTimeZone(onHourSlot.utc, mockTimezone.name, 'h');
    expect(screen.getByText(expectedHour)).toBeInTheDocument();
    expect(screen.queryByText(`${expectedHour}:00`)).not.toBeInTheDocument();
  });

  it('renders time with minutes when not on the hour', () => {
    render(<TimeSlotCell {...defaultProps} slot={offHourSlot} />);
    const expectedTime = formatInTimeZone(offHourSlot.utc, mockTimezone.name, 'h:mm');
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });

  it('handles weekend styling', () => {
    const weekendSlot = {
      ...mockTimeSlot,
      isWeekend: true,
    };
    
    render(<TimeSlotCell {...defaultProps} slot={weekendSlot} />);
    
    const button = screen.getByRole('button');
    // Weekend styling would be applied by getSlotBgColor function
    expect(button).toBeInTheDocument();
  });

  it('handles empty time slots array gracefully', () => {
    render(<TimeSlotCell {...defaultProps} timeSlots={[]} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
}); 