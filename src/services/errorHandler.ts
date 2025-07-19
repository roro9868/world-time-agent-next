/**
 * Centralized error handling service for the World Time Agent application
 * Provides consistent error reporting, logging, and user feedback
 */

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class TimezoneError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
    public severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    super(message);
    this.name = 'TimezoneError';
  }
}

/**
 * Validates IANA timezone identifier
 * @param timezone - Timezone string to validate
 * @returns true if valid, false otherwise
 * @example
 * isValidTimezone('America/New_York') // true
 * isValidTimezone('Invalid/Timezone') // false
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely executes timezone calculations with error handling
 * @param operation - Function to execute
 * @param fallback - Fallback value if operation fails
 * @param errorContext - Context for error reporting
 * @returns Result of operation or fallback value
 */
export function safeTimezoneOperation<T>(
  operation: () => T,
  fallback: T,
  errorContext?: string
): T {
  try {
    return operation();
  } catch (error) {
    const appError: AppError = {
      code: 'TIMEZONE_CALCULATION_ERROR',
      message: `Timezone calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { context: errorContext, originalError: error },
      timestamp: Date.now(),
      severity: 'medium'
    };
    
    // Log error for debugging
    console.warn('Timezone calculation error:', appError);
    
    // Return fallback value
    return fallback;
  }
}

/**
 * Handles clipboard operations with proper error handling
 * @param text - Text to copy to clipboard
 * @returns Promise that resolves to success status
 */
export async function safeClipboardWrite(text: string): Promise<boolean> {
  try {
    // Check if clipboard API is available
    if (!navigator.clipboard) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
    
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    const appError: AppError = {
      code: 'CLIPBOARD_ERROR',
      message: 'Failed to copy to clipboard',
      details: { text: text.substring(0, 100), error },
      timestamp: Date.now(),
      severity: 'low'
    };
    
    console.warn('Clipboard error:', appError);
    return false;
  }
}

interface LocationData {
  timezone?: string;
  city?: string;
  country?: string;
  [key: string]: unknown;
}

/**
 * Validates and sanitizes location data
 * @param location - Location object to validate
 * @returns Validated location or null if invalid
 */
export function validateLocation(location: LocationData): LocationData | null {
  try {
    if (!location || typeof location !== 'object') {
      return null;
    }
    
    const { timezone, city, country } = location;
    
    // Validate required fields
    if (!timezone || typeof timezone !== 'string') {
      throw new TimezoneError('INVALID_TIMEZONE', 'Timezone is required and must be a string');
    }
    
    if (!city || typeof city !== 'string') {
      throw new TimezoneError('INVALID_CITY', 'City is required and must be a string');
    }
    
    if (!country || typeof country !== 'string') {
      throw new TimezoneError('INVALID_COUNTRY', 'Country is required and must be a string');
    }
    
    // Validate timezone format
    if (!isValidTimezone(timezone)) {
      throw new TimezoneError('INVALID_TIMEZONE_FORMAT', `Invalid timezone format: ${timezone}`);
    }
    
    return {
      timezone: timezone.trim(),
      city: city.trim(),
      country: country.trim(),
      ...location
    };
  } catch (error) {
    if (error instanceof TimezoneError) {
      console.warn('Location validation error:', error);
    }
    return null;
  }
}

/**
 * Error boundary hook for React components
 * @param error - Error object
 * @param errorInfo - Error info from React
 */
export function logComponentError(error: Error, errorInfo: { componentStack: string }): void {
  const appError: AppError = {
    code: 'COMPONENT_ERROR',
    message: error.message,
    details: {
      stack: error.stack,
      componentStack: errorInfo.componentStack
    },
    timestamp: Date.now(),
    severity: 'high'
  };
  
  console.error('Component error:', appError);
  
  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry, LogRocket, etc.
    // errorTrackingService.captureError(appError);
  }
}

/**
 * Handles date parsing with error handling
 * @param dateString - Date string to parse
 * @param fallback - Fallback date if parsing fails
 * @returns Parsed date or fallback
 */
export function safeDateParse(dateString: string, fallback: Date = new Date()): Date {
  try {
    const parsed = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(parsed.getTime())) {
      throw new Error('Invalid date string');
    }
    
    return parsed;
  } catch (error) {
    console.warn('Date parsing error:', { dateString, error });
    return fallback;
  }
}