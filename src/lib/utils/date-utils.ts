import { formatDistanceToNow as fnsFormatDistanceToNow } from "date-fns";

/**
 * Safe date formatting utility that handles invalid dates gracefully
 */
export const dateUtils = {
  /**
   * Safely formats a date using formatDistanceToNow with error handling
   * @param date - Date string, Date object, or null/undefined
   * @param options - Options for formatDistanceToNow
   * @param fallback - Fallback string to return if date is invalid
   * @returns Formatted date string or fallback
   */
  safeFormatDistanceToNow(
    date: string | Date | null | undefined,
    options?: Parameters<typeof fnsFormatDistanceToNow>[1],
    fallback: string = 'Never'
  ): string {
    if (!date) return fallback;
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return fallback;
      }
      
      return fnsFormatDistanceToNow(dateObj, options);
    } catch (error) {
      console.warn('Date formatting error:', error, 'for date:', date);
      return fallback;
    }
  },

  /**
   * Validates if a date value is valid
   * @param date - Date string, Date object, or null/undefined
   * @returns boolean indicating if date is valid
   */
  isValidDate(date: string | Date | null | undefined): boolean {
    if (!date) return false;
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return !isNaN(dateObj.getTime());
    } catch {
      return false;
    }
  },

  /**
   * Safely converts a date value to a Date object
   * @param date - Date string, Date object, or null/undefined
   * @returns Date object or null if invalid
   */
  safeToDate(date: string | Date | null | undefined): Date | null {
    if (!date) return null;
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return isNaN(dateObj.getTime()) ? null : dateObj;
    } catch {
      return null;
    }
  }
};
