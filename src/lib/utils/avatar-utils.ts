/**
 * Utility functions for generating consistent and visually appealing avatars
 */

// Subtle color palette for avatar backgrounds
const avatarColors = [
  'bg-slate-100 text-slate-700',
  'bg-gray-100 text-gray-700', 
  'bg-zinc-100 text-zinc-700',
  'bg-neutral-100 text-neutral-700',
  'bg-stone-100 text-stone-700',
  'bg-slate-200 text-slate-800',
  'bg-gray-200 text-gray-800',
  'bg-zinc-200 text-zinc-800',
  'bg-neutral-200 text-neutral-800',
  'bg-stone-200 text-stone-800'
];

// Dark mode color palette
const avatarColorsDark = [
  'bg-slate-700 text-slate-200',
  'bg-gray-700 text-gray-200',
  'bg-zinc-700 text-zinc-200', 
  'bg-neutral-700 text-neutral-200',
  'bg-stone-700 text-stone-200',
  'bg-slate-600 text-slate-100',
  'bg-gray-600 text-gray-100',
  'bg-zinc-600 text-zinc-100',
  'bg-neutral-600 text-neutral-100',
  'bg-stone-600 text-stone-100'
];

/**
 * Generate a consistent color for an avatar based on the name
 */
export function getAvatarColor(name: string, isDark = false): string {
  if (!name) return isDark ? 'bg-gray-600' : 'bg-gray-500';
  
  // Simple hash function to get consistent color for same name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colorIndex = Math.abs(hash) % avatarColors.length;
  return isDark ? avatarColorsDark[colorIndex] : avatarColors[colorIndex];
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string, maxLength = 2): string {
  if (!name) return '?';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    // Single word - take first characters
    return words[0].substring(0, maxLength).toUpperCase();
  } else {
    // Multiple words - take first character of each word
    return words
      .slice(0, maxLength)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  }
}

/**
 * Generate avatar props for consistent styling
 */
export function getAvatarProps(name: string, size: 'sm' | 'md' | 'lg' = 'md', isDark = false) {
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name, isDark);
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm', 
    lg: 'h-12 w-12 text-base'
  };
  
  return {
    initials,
    colorClass,
    sizeClass: sizeClasses[size],
    className: `${sizeClasses[size]} border border-border/50`
  };
}

/**
 * Generate avatar props for table view (smaller)
 */
export function getTableAvatarProps(name: string, isDark = false) {
  return getAvatarProps(name, 'sm', isDark);
}

/**
 * Generate avatar props for card view (medium)
 */
export function getCardAvatarProps(name: string, isDark = false) {
  return getAvatarProps(name, 'md', isDark);
}

/**
 * Generate avatar props for deleted agents (with orange theme)
 */
export function getDeletedAvatarProps(name: string, size: 'sm' | 'md' | 'lg' = 'md') {
  const initials = getInitials(name);
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base'
  };
  
  return {
    initials,
    colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    sizeClass: sizeClasses[size],
    className: `${sizeClasses[size]} border border-orange-200/50`
  };
}

/**
 * Generate avatar props for draft agents (with blue theme)
 */
export function getDraftAvatarProps(name: string, size: 'sm' | 'md' | 'lg' = 'md') {
  const initials = getInitials(name);
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base'
  };
  
  return {
    initials,
    colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    sizeClass: sizeClasses[size],
    className: `${sizeClasses[size]} border border-blue-200/50`
  };
}
