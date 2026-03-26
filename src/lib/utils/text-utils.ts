/**
 * Truncates text to a specified length and adds ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Truncates text for table display (shorter)
 * @param text - The text to truncate
 * @returns Truncated text suitable for table cells
 */
export function truncateForTable(text: string): string {
  return truncateText(text, 80);
}

/**
 * Truncates text for card display (longer)
 * @param text - The text to truncate
 * @returns Truncated text suitable for cards
 */
export function truncateForCard(text: string): string {
  return truncateText(text, 120);
}
