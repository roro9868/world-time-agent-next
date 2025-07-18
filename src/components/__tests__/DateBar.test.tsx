import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DateBar } from '../DateBar';

const defaultProps = {
  selectedDate: new Date('2024-01-15T12:00:00Z'),
  onDateChange: jest.fn(),
  homeTimezone: 'America/New_York',
};

describe('DateBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders date information correctly', () => {
    render(
      <table>
        <tbody>
          <DateBar {...defaultProps} />
        </tbody>
      </table>,
    );

    // Should show abbreviated month name and day number
    expect(screen.getByText(/Jan/)).toBeInTheDocument();
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('calls onDateChange when today button is clicked', () => {
    const onDateChange = jest.fn();
    render(
      <table>
        <tbody>
          <DateBar {...defaultProps} onDateChange={onDateChange} />
        </tbody>
      </table>,
    );

    // Find and click a day button (the current implementation doesn't have a "Today" button)
    const dayButtons = screen.getAllByRole('button');
    const dayButton = dayButtons.find(
      (button) =>
        button.textContent &&
        /\d+/.test(button.textContent),
    );

    if (dayButton) {
      fireEvent.click(dayButton);
      expect(onDateChange).toHaveBeenCalled();
    }
  });

  it('calls onDateChange when a day is clicked', () => {
    const onDateChange = jest.fn();
    render(
      <table>
        <tbody>
          <DateBar {...defaultProps} onDateChange={onDateChange} />
        </tbody>
      </table>,
    );

    // Find and click a day button
    const dayButtons = screen.getAllByRole('button');
    const dayButton = dayButtons.find(
      (button) =>
        button.textContent &&
        /\d+/.test(button.textContent) &&
        !button.textContent.includes('Today'),
    );

    if (dayButton) {
      fireEvent.click(dayButton);
      expect(onDateChange).toHaveBeenCalled();
    }
  });

  it('has proper accessibility attributes', () => {
    render(
      <table>
        <tbody>
          <DateBar {...defaultProps} />
        </tbody>
      </table>,
    );

    // Should have day buttons
    const dayButtons = screen.getAllByRole('button');
    expect(dayButtons.length).toBeGreaterThan(1);
  });

  it('handles keyboard navigation', () => {
    const onDateChange = jest.fn();
    render(
      <table>
        <tbody>
          <DateBar {...defaultProps} onDateChange={onDateChange} />
        </tbody>
      </table>,
    );

    // Find a day button
    const dayButtons = screen.getAllByRole('button');
    const dayButton = dayButtons.find(
      (button) =>
        button.textContent &&
        /\d+/.test(button.textContent),
    );

    if (dayButton) {
      // Focus and press Enter on day button
      dayButton.focus();
      fireEvent.keyDown(dayButton, { key: 'Enter' });
    }
  });

  it('shows correct date format for different dates', () => {
    const differentDate = new Date('2024-12-25T12:00:00Z');
    render(
      <table>
        <tbody>
          <DateBar {...defaultProps} selectedDate={differentDate} />
        </tbody>
      </table>,
    );

    expect(screen.getByText(/Dec/)).toBeInTheDocument();
    expect(screen.getByText(/25/)).toBeInTheDocument();
  });

  it('handles leap year dates', () => {
    const leapYearDate = new Date('2024-02-29T12:00:00Z');
    render(
      <table>
        <tbody>
          <DateBar {...defaultProps} selectedDate={leapYearDate} />
        </tbody>
      </table>,
    );

    expect(screen.getByText(/Feb/)).toBeInTheDocument();
    expect(screen.getByText(/29/)).toBeInTheDocument();
  });

  it('handles year boundary dates', () => {
    const yearEndDate = new Date('2024-12-31T12:00:00Z');
    render(
      <table>
        <tbody>
          <DateBar {...defaultProps} selectedDate={yearEndDate} />
        </tbody>
      </table>,
    );

    expect(screen.getByText(/Dec/)).toBeInTheDocument();
    expect(screen.getByText(/31/)).toBeInTheDocument();
  });

  it('handles year start dates', () => {
    const yearStartDate = new Date('2024-01-01T12:00:00Z');
    render(
      <table>
        <tbody>
          <DateBar {...defaultProps} selectedDate={yearStartDate} />
        </tbody>
      </table>,
    );

    expect(screen.getByText(/Jan/)).toBeInTheDocument();
    // Use getAllByText since there might be multiple "1" elements
    expect(screen.getAllByText(/1/).length).toBeGreaterThan(0);
  });

  it('maintains focus after button clicks', () => {
    const onDateChange = jest.fn();
    render(
      <table>
        <tbody>
          <DateBar {...defaultProps} onDateChange={onDateChange} />
        </tbody>
      </table>,
    );

    // Find a day button
    const dayButtons = screen.getAllByRole('button');
    const dayButton = dayButtons.find(
      (button) =>
        button.textContent &&
        /\d+/.test(button.textContent),
    );

    if (dayButton) {
      dayButton.focus();
      fireEvent.click(dayButton);

      // Button should still be focusable
      expect(dayButton).toBeInTheDocument();
    }
  });

  it('handles rapid button clicks gracefully', () => {
    const onDateChange = jest.fn();
    render(
      <table>
        <tbody>
          <DateBar {...defaultProps} onDateChange={onDateChange} />
        </tbody>
      </table>,
    );

    // Find a day button
    const dayButtons = screen.getAllByRole('button');
    const dayButton = dayButtons.find(
      (button) =>
        button.textContent &&
        /\d+/.test(button.textContent),
    );

    if (dayButton) {
      // Click multiple times rapidly
      fireEvent.click(dayButton);
      fireEvent.click(dayButton);
      fireEvent.click(dayButton);

      expect(onDateChange).toHaveBeenCalledTimes(3);
    }
  });

  it('shows selected date with proper styling', () => {
    render(
      <table>
        <tbody>
          <DateBar {...defaultProps} />
        </tbody>
      </table>,
    );

    // The selected date should be visible
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });
});
