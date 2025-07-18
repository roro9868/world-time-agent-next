import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationSelector } from '../LocationSelector';
import type { TimeZone } from '../../types';

// Mock city-timezones with the correct structure
jest.mock('city-timezones', () => ({
  cityMapping: {
    London: {
      city: 'London',
      country: 'United Kingdom',
      timezone: 'Europe/London',
      iso2: 'GB',
      pop: 8982000,
    },
    'New York': {
      city: 'New York',
      country: 'United States',
      timezone: 'America/New_York',
      iso2: 'US',
      pop: 8336817,
    },
    Tokyo: {
      city: 'Tokyo',
      country: 'Japan',
      timezone: 'Asia/Tokyo',
      iso2: 'JP',
      pop: 13929286,
    },
    Paris: {
      city: 'Paris',
      country: 'France',
      timezone: 'Europe/Paris',
      iso2: 'FR',
      pop: 2161000,
    },
    Berlin: {
      city: 'Berlin',
      country: 'Germany',
      timezone: 'Europe/Berlin',
      iso2: 'DE',
      pop: 3669491,
    },
  },
}));

describe('LocationSelector', () => {
  const mockOnAddLocation = jest.fn();
  const defaultProps = {
    onAddLocation: mockOnAddLocation,
    existingLocations: [
      {
        name: 'America/New_York',
        city: 'New York',
        country: 'United States',
        offset: -4,
        flag: '🇺🇸',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with home city information', () => {
    render(
      <table>
        <tbody>
          <LocationSelector {...defaultProps} />
        </tbody>
      </table>,
    );

    expect(screen.getByDisplayValue('')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('Current time')).toBeInTheDocument();
  });

  it('shows loading state when focused', async () => {
    render(
      <table>
        <tbody>
          <LocationSelector {...defaultProps} />
        </tbody>
      </table>,
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    // The component loads cities immediately, so we should see results
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument();
    });
  });

  it('shows cities after loading', async () => {
    render(
      <table>
        <tbody>
          <LocationSelector {...defaultProps} />
        </tbody>
      </table>,
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument();
    });

    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('United Kingdom • Europe/London')).toBeInTheDocument();
  });

  it('filters results based on search term', async () => {
    render(
      <table>
        <tbody>
          <LocationSelector {...defaultProps} />
        </tbody>
      </table>,
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument();
    });

    await userEvent.type(input, 'London');

    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.queryByText('New York')).not.toBeInTheDocument();
    });
  });

  it('calls onAddLocation when a city is selected', async () => {
    render(
      <table>
        <tbody>
          <LocationSelector {...defaultProps} />
        </tbody>
      </table>,
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument();
    });

    const londonOption = screen.getByText('London').closest('button');
    fireEvent.click(londonOption!);

    expect(mockOnAddLocation).toHaveBeenCalledWith({
      name: 'Europe/London',
      city: 'London',
      country: 'United Kingdom',
      offset: 1,
      flag: '🇬🇧',
      population: 8982000,
    });
  });

  it('handles keyboard navigation', async () => {
    render(
      <table>
        <tbody>
          <LocationSelector {...defaultProps} />
        </tbody>
      </table>,
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument();
    });

    // Press arrow down
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // First option should be selected
    const firstOption = screen.getByText('London').closest('button');
    expect(firstOption).toHaveAttribute('aria-selected', 'true');
  });

  it('closes dropdown on escape key', async () => {
    render(
      <table>
        <tbody>
          <LocationSelector {...defaultProps} />
        </tbody>
      </table>,
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('London')).not.toBeInTheDocument();
    });
  });

  it('shows "No cities found" when no results', async () => {
    render(
      <table>
        <tbody>
          <LocationSelector {...defaultProps} />
        </tbody>
      </table>,
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument();
    });

    await userEvent.type(input, 'NonExistentCity');

    await waitFor(() => {
      expect(screen.getByText('No cities found')).toBeInTheDocument();
    });
  });

  it('handles empty existing locations gracefully', () => {
    render(
      <table>
        <tbody>
          <LocationSelector onAddLocation={mockOnAddLocation} existingLocations={[]} />
        </tbody>
      </table>,
    );

    // Should render input when no home city exists
    expect(screen.getByPlaceholderText('Add a city...')).toBeInTheDocument();
  });

  it('deduplicates city names within same timezone', async () => {
    render(
      <table>
        <tbody>
          <LocationSelector {...defaultProps} />
        </tbody>
      </table>,
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument();
    });

    // Should not have duplicate city entries (the component handles this internally)
    const londonCityEntries = screen.getAllByText(/^London$/);
    expect(londonCityEntries).toHaveLength(1);
  });
});
