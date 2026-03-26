/**
 * Timezone utility functions for handling user timezone detection and datetime conversions
 */

/**
 * Get the user's timezone from browser
 */
export function getUserTimezone(): string {
  if (typeof window === 'undefined') {
    return 'UTC';
  }
  
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Failed to detect timezone, falling back to UTC:', error);
    return 'UTC';
  }
}

/**
 * Get timezone offset in minutes from UTC
 */
export function getTimezoneOffset(timezone: string = getUserTimezone()): number {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const targetTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    return (targetTime.getTime() - utc.getTime()) / 60000;
  } catch (error) {
    console.warn('Failed to get timezone offset, using UTC:', error);
    return 0;
  }
}

/**
 * Format timezone offset as +HH:MM or -HH:MM
 */
export function formatTimezoneOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const hours = Math.floor(absOffset / 60);
  const minutes = absOffset % 60;
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Convert a local datetime to UTC for API submission
 * @param date - The date object
 * @param time - Time string in HH:MM or HH:MM:SS format
 * @returns ISO 8601 datetime string in UTC (always +00:00)
 */
export function createScheduledDateTime(
  date: Date, 
  time: string
): string {
  try {
    // Create a datetime string in the user's local timezone
    const dateStr = date.toISOString().split('T')[0];
    
    // Handle time format - ensure it has seconds but not double seconds
    let timeStr = time;
    if (timeStr.split(':').length === 2) {
      // If only HH:MM, add seconds
      timeStr = `${timeStr}:00`;
    } else if (timeStr.split(':').length === 3) {
      // If HH:MM:SS, use as is
      timeStr = timeStr;
    }
    
    // Create a datetime string in local timezone
    const localDateTimeStr = `${dateStr}T${timeStr}`;
    
    // Create a date object - this will be interpreted in the user's local timezone
    const localDate = new Date(localDateTimeStr);
    
    // Convert to UTC and return in ISO format with +00:00
    const utcDateStr = localDate.toISOString().replace('Z', '+00:00');
    
    return utcDateStr;
  } catch (error) {
    console.error('Error creating scheduled datetime:', error);
    // Fallback to simple UTC format
    const dateStr = date.toISOString().split('T')[0];
    let timeStr = time;
    if (timeStr.split(':').length === 2) {
      timeStr = `${timeStr}:00`;
    } else if (timeStr.split(':').length === 3) {
      timeStr = timeStr;
    }
    return `${dateStr}T${timeStr}+00:00`;
  }
}

/**
 * Parse a UTC datetime string and convert to user's timezone for display
 * @param utcDateTime - ISO 8601 datetime string
 * @param timezone - Target timezone (defaults to user's timezone)
 * @returns Formatted datetime string in user's timezone
 */
export function formatDateTimeForUser(
  utcDateTime: string, 
  timezone: string = getUserTimezone()
): string {
  try {
    const date = new Date(utcDateTime);
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting datetime for user:', error);
    return utcDateTime;
  }
}

/**
 * Get a list of common timezones for selection
 */
export function getCommonTimezones(): Array<{ value: string; label: string }> {
  const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Kolkata', label: 'Mumbai/Delhi (IST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  ];
  
  return timezones;
}

/**
 * Get current time in user's timezone
 */
export function getCurrentTimeInTimezone(timezone: string = getUserTimezone()): string {
  try {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error getting current time in timezone:', error);
    return new Date().toISOString().split('T')[1].split('.')[0];
  }
}

/**
 * Get current date in user's timezone
 */
export function getCurrentDateInTimezone(timezone: string = getUserTimezone()): string {
  try {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Error getting current date in timezone:', error);
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Debug function to log datetime formatting details
 */
export function debugDateTimeFormatting(
  date: Date, 
  time: string
): void {
  console.group('🕐 DateTime Formatting Debug');
  console.log('Input Date:', date);
  console.log('Input Time:', time);
  console.log('User Timezone:', getUserTimezone());
  console.log('Time Parts:', time.split(':'));
  console.log('Time Length:', time.split(':').length);
  
  const result = createScheduledDateTime(date, time);
  console.log('Final Result:', result);
  console.log('Result Length:', result.length);
  console.log('Is Valid ISO UTC:', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+00:00$/.test(result));
  console.groupEnd();
}
