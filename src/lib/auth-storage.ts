import { User, Session } from '@/types/auth';

const AUTH_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  SESSIONS: 'sessions',
  ORGANIZATION: 'organization',
  USER_CACHE_TIME: 'user_cache_time',
  SESSIONS_CACHE_TIME: 'sessions_cache_time',
  LAST_FETCH_TIME: 'last_fetch_time'
} as const;

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export const authStorage = {
  // Token management
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
  },

  setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, token);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, token);
  },

  // User management with cache checking
  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const userStr = localStorage.getItem(AUTH_KEYS.USER);
      
      if (!userStr) return null;
      
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  setUser(user: User): void {
    if (typeof window === 'undefined') return;

    // Ensure user is defined before processing
    if (!user) {
      console.warn('setUser called with undefined user');
      return;
    }

    // Only set organization if user has organization_id but no organization object
    // This will be populated by API calls when needed
    
    try {
      localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(AUTH_KEYS.USER_CACHE_TIME, Date.now().toString());
      
      // Also store organization separately for easy access
      if (user.organization) {
        this.setOrganization(user.organization);
      }
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  },

  // Sessions management with cache checking
  getSessions(): Session[] {
    if (typeof window === 'undefined') return [];
    try {
      const sessionsStr = localStorage.getItem(AUTH_KEYS.SESSIONS);
      const cacheTime = localStorage.getItem(AUTH_KEYS.SESSIONS_CACHE_TIME);
      
      if (!sessionsStr) return [];
      
      // Check if cache is still valid
      if (cacheTime && (Date.now() - parseInt(cacheTime)) > CACHE_DURATION) {
        // Cache is stale, return empty array to force refresh
        this.clearSessionsCache();
        return [];
      }
      
      return JSON.parse(sessionsStr);
    } catch {
      return [];
    }
  },

  setSessions(sessions: Session[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(AUTH_KEYS.SESSIONS, JSON.stringify(sessions));
      localStorage.setItem(AUTH_KEYS.SESSIONS_CACHE_TIME, Date.now().toString());
    } catch (error) {
      console.error('Failed to store sessions data:', error);
    }
  },

  // Organization management
  getOrganization(): { id: string; name: string } | null {
    if (typeof window === 'undefined') return null;
    try {
      const orgStr = localStorage.getItem(AUTH_KEYS.ORGANIZATION);
      return orgStr ? JSON.parse(orgStr) : null;
    } catch {
      return null;
    }
  },

  setOrganization(organization: { id: string; name: string }): void {
    if (typeof window === 'undefined') return;

    // Ensure organization is defined before storing
    if (!organization) {
      console.warn('setOrganization called with undefined organization');
      return;
    }

    try {
      localStorage.setItem(AUTH_KEYS.ORGANIZATION, JSON.stringify(organization));
    } catch (error) {
      console.error('Failed to store organization data:', error);
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const hasToken = !!this.getAccessToken();
    return hasToken;
  },

  // Get last fetch time
  getLastFetchTime(): number {
    if (typeof window === 'undefined') return 0;
    try {
      const timeStr = localStorage.getItem(AUTH_KEYS.LAST_FETCH_TIME);
      return timeStr ? parseInt(timeStr) : 0;
    } catch {
      return 0;
    }
  },

  // Set last fetch time
  setLastFetchTime(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(AUTH_KEYS.LAST_FETCH_TIME, Date.now().toString());
    } catch (error) {
      console.error('Failed to store last fetch time:', error);
    }
  },

  // Clear all auth data
  clear(): void {
    if (typeof window === 'undefined') return;
    Object.values(AUTH_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  // Clear only token data (keep user info for faster reload)
  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
  },

  // Clear specific cache entries
  clearUserCache(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_KEYS.USER);
    localStorage.removeItem(AUTH_KEYS.USER_CACHE_TIME);
  },

  clearSessionsCache(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_KEYS.SESSIONS);
    localStorage.removeItem(AUTH_KEYS.SESSIONS_CACHE_TIME);
  },

  // Force refresh by clearing all cache timestamps
  invalidateCache(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_KEYS.USER_CACHE_TIME);
    localStorage.removeItem(AUTH_KEYS.SESSIONS_CACHE_TIME);
    localStorage.removeItem(AUTH_KEYS.LAST_FETCH_TIME);
  }
};
