/**
 * Timezone utilities for handling user timezone detection and date conversion
 */

export interface TimezoneInfo {
  timezone: string;
  offset: number;
  offsetString: string;
  abbreviation: string;
}

/**
 * Get the user's current timezone information
 */
export function getUserTimezone(): TimezoneInfo {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const offset = -now.getTimezoneOffset(); // getTimezoneOffset returns negative values for positive offsets
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;
  const offsetString = `${offset >= 0 ? '+' : '-'}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
  
  // Get timezone abbreviation
  const abbreviation = new Intl.DateTimeFormat('en', {
    timeZoneName: 'short',
    timeZone: timezone
  }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value || 'UTC';

  return {
    timezone,
    offset,
    offsetString,
    abbreviation
  };
}

/**
 * Create a Date object from date and time strings in the user's local timezone
 * This ensures the time the user selects is exactly what gets stored
 */
export function createLocalDateTime(dateString: string, timeString: string): Date {
  // Parse date components
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Create date in local timezone (what the user actually selected)
  const localDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
  return localDateTime;
}

/**
 * Create a Date object that represents the exact time the user selected,
 * accounting for their timezone
 */
export function createScheduledDateTime(dateString: string, timeString: string): Date {
  const localDateTime = createLocalDateTime(dateString, timeString);
  
  console.log('🌍 Timezone Debug:', {
    userTimezone: getUserTimezone(),
    selectedDate: dateString,
    selectedTime: timeString,
    localDateTime: localDateTime.toISOString(),
    localString: localDateTime.toLocaleString(),
    utcString: localDateTime.toUTCString()
  });
  
  return localDateTime;
}

/**
 * Format a date for display in the user's timezone
 */
export function formatDateTimeForUser(date: Date): string {
  const timezone = getUserTimezone();
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: timezone.timezone
  }).format(date);
}

/**
 * Convert a UTC date string from database back to user's local time for display
 */
export function convertUTCToLocal(utcDateString: string): Date {
  return new Date(utcDateString);
}

/**
 * Format a database date string for display in user's local timezone
 * This is the main function to use for displaying scheduled_at dates
 */
export function formatScheduledDateForDisplay(dateString: string | null): string {
  if (!dateString) return 'Not scheduled';

  try {
    // Create date object from database string (which is in UTC)
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    // Format in user's local timezone
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a database date string for display with date-fns format
 * This maintains compatibility with existing date-fns usage
 */
export function formatScheduledDateWithDateFns(dateString: string | null, formatStr: string = "MMM d, yyyy 'at' h:mm a"): string {
  if (!dateString) return 'Not scheduled';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    // Use date-fns format if available, otherwise fallback to native formatting
    try {
      // Try to use date-fns format function if it's imported
      const { format } = require('date-fns');
      return format(date, formatStr);
    } catch {
      // Fallback to native formatting
      return formatScheduledDateForDisplay(dateString);
    }
  } catch (error) {
    console.error('Error formatting date with date-fns:', error);
    return 'Invalid date';
  }
}

/**
 * Get the current time in user's timezone, formatted for time input
 */
export function getCurrentTimeForInput(): { date: string; time: string } {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().substring(0, 5);
  
  return { date, time };
}

/**
 * Get a future time (default 1 hour from now) for default scheduling
 */
export function getFutureTimeForInput(hoursFromNow: number = 1): { date: string; time: string } {
  const future = new Date();
  future.setHours(future.getHours() + hoursFromNow);
  
  const date = future.toISOString().split('T')[0];
  const time = future.toTimeString().substring(0, 5);
  
  return { date, time };
}

/**
 * Validate that a scheduled time is in the future
 */
export function validateFutureTime(dateString: string, timeString: string, minMinutesFromNow: number = 1): {
  isValid: boolean;
  error?: string;
  scheduledTime?: Date;
} {
  try {
    const scheduledTime = createScheduledDateTime(dateString, timeString);
    const now = new Date();
    const minTime = new Date(now.getTime() + minMinutesFromNow * 60 * 1000);
    
    if (scheduledTime <= minTime) {
      return {
        isValid: false,
        error: `Scheduled time must be at least ${minMinutesFromNow} minute(s) in the future. Current time: ${now.toLocaleTimeString()}, Minimum time: ${minTime.toLocaleTimeString()}`,
        scheduledTime
      };
    }
    
    return {
      isValid: true,
      scheduledTime
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid date or time format'
    };
  }
}

/**
 * Convert a Date object to ISO string while preserving the local time
 * This prevents timezone conversion when storing to database
 */
export function toLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // Create ISO string without timezone conversion
  const localISOString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;

  console.log('🕐 Local ISO Conversion:', {
    originalDate: date.toLocaleString(),
    standardISO: date.toISOString(),
    localISO: localISOString,
    timezone: getUserTimezone().timezone
  });

  return localISOString;
}

/**
 * Create scheduled date time from a Date object (for flexible timing)
 */
export function createScheduledDateTimeFromDate(date: Date): Date {
  // Ensure the date is in the user's timezone
  const timezone = getUserTimezone();

  console.log('🕐 Creating scheduled time from Date object:', {
    inputDate: date.toLocaleString(),
    timezone: timezone.timezone,
    offset: timezone.offsetString
  });

  return new Date(date);
}

/**
 * Validate that a Date object is in the future
 */
export function validateFutureDate(date: Date, bufferMinutes: number = 1): ValidationResult {
  const now = new Date();
  const bufferTime = new Date(now.getTime() + (bufferMinutes * 60 * 1000));

  if (date <= bufferTime) {
    return {
      isValid: false,
      error: `Please select a time at least ${bufferMinutes} minute(s) in the future`,
      scheduledTime: null
    };
  }

  return {
    isValid: true,
    error: null,
    scheduledTime: date
  };
}

/**
 * Format date for display with timezone info (PostScheduler style)
 */
export function formatDateTimeForDisplay(date: Date): string {
  const timezone = getUserTimezone();

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  };

  return date.toLocaleString('en-US', options);
}

/**
 * Debug function to log timezone information
 */
export function logTimezoneDebug(dateString: string, timeString: string) {
  const timezone = getUserTimezone();
  const scheduledTime = createScheduledDateTime(dateString, timeString);

  console.log('🌍 Complete Timezone Debug:', {
    userTimezone: timezone,
    input: { dateString, timeString },
    scheduledTime: {
      iso: scheduledTime.toISOString(),
      localISO: toLocalISOString(scheduledTime),
      local: scheduledTime.toLocaleString(),
      utc: scheduledTime.toUTCString(),
      timestamp: scheduledTime.getTime()
    },
    comparison: {
      now: new Date().toISOString(),
      isInFuture: scheduledTime > new Date()
    }
  });
}

/**
 * Debug function for Date object input
 */
export function logDateTimezoneDebug(date: Date) {
  const timezone = getUserTimezone();

  console.log('🌍 Date Timezone Debug:', {
    userTimezone: timezone,
    inputDate: {
      iso: date.toISOString(),
      localISO: toLocalISOString(date),
      local: date.toLocaleString(),
      display: formatDateTimeForDisplay(date),
      timestamp: date.getTime()
    },
    comparison: {
      now: new Date().toISOString(),
      isInFuture: date > new Date()
    }
  });
}
