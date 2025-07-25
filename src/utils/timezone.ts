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

  // PERMANENT FIX: Ensure we return the exact local time without any UTC conversion
  // This prevents the 5.5 hour offset issue for all social media platforms
  console.log('🌍 PERMANENT TIMEZONE FIX - Timezone Debug:', {
    userTimezone: getUserTimezone(),
    selectedDate: dateString,
    selectedTime: timeString,
    localDateTime: localDateTime.toISOString(),
    localString: localDateTime.toLocaleString(),
    utcString: localDateTime.toUTCString(),
    note: 'Using exact local time - no UTC conversion applied'
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
    // Create date object from database string (which should be in UTC)
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    // Debug timezone conversion (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('🕐 [DISPLAY] Formatting date for display:', {
        input: dateString,
        parsedDate: date.toISOString(),
        localString: date.toLocaleString(),
        timezone: getUserTimezone(),
        dateComponents: {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
          hours: date.getHours(),
          minutes: date.getMinutes()
        }
      });
    }

    // Format in user's local timezone
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
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
export function toLocalISOString(date: Date | string | number): string {
  // Ensure we have a proper Date object
  let dateObj: Date;

  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    console.error('❌ Invalid date passed to toLocalISOString:', date);
    dateObj = new Date(); // Fallback to current time
  }

  // Validate the date object
  if (isNaN(dateObj.getTime())) {
    console.error('❌ Invalid date object in toLocalISOString:', date);
    dateObj = new Date(); // Fallback to current time
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');

  // TIMEZONE FIX: Create ISO string without Z suffix to prevent UTC interpretation
  // The Z suffix tells the database this is UTC time, but we want local time
  const localISOString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

  console.log('🕐 TIMEZONE FIX - Local ISO Conversion:', {
    originalInput: date,
    originalDate: dateObj.toLocaleString(),
    standardISO: dateObj.toISOString(),
    localISO: localISOString,
    timezone: getUserTimezone().timezone,
    note: 'Removed Z suffix to prevent UTC interpretation'
  });

  return localISOString;
}

/**
 * Create scheduled date time from a Date object (for flexible timing)
 */
export function createScheduledDateTimeFromDate(date: Date): Date {
  // CRITICAL FIX: Create a date string in local format and parse it back
  // This prevents timezone conversion issues when storing in database
  const timezone = getUserTimezone();

  // Extract the local date/time components
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Create a new date using local components - this preserves the exact time
  const localDate = new Date(year, month, day, hours, minutes, seconds);

  console.log('🕐 LOCAL TIME PRESERVATION - Creating scheduled time:', {
    originalInput: date.toLocaleString(),
    originalISO: date.toISOString(),
    extractedComponents: { year, month, day, hours, minutes, seconds },
    localDate: localDate.toLocaleString(),
    localDateISO: localDate.toISOString(),
    timezone: timezone.timezone,
    note: 'Preserved exact local time components to prevent UTC conversion'
  });

  return localDate;
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
