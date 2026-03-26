import { authStorage } from './auth-storage';
import { User } from '@/types/auth';

export interface ValidationResult {
  isValid: boolean;
  user: User | null;
  error?: string;
  needsRefresh: boolean;
}

const MOCK_TOKEN_KEY = 'mock_auth_token';
const MOCK_TOKEN_VALUE = 'mock-auth-token-123';

export class AuthValidator {
  static async validateAuth(): Promise<ValidationResult> {
    const user = authStorage.getUser();
    const hasToken = this.hasBasicAuth();

    if (hasToken && user) {
      return { isValid: true, user, needsRefresh: false };
    }

    return {
      isValid: false,
      user: null,
      error: 'Not authenticated',
      needsRefresh: false,
    };
  }

  static async validateAndRestore(onLogout?: () => void): Promise<ValidationResult> {
    const result = await this.validateAuth();
    if (!result.isValid && onLogout) {
      onLogout();
    }
    return result;
  }

  static hasBasicAuth(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(MOCK_TOKEN_KEY) === MOCK_TOKEN_VALUE;
  }

  static hasValidUserData(): boolean {
    return !!authStorage.getUser();
  }

  static setMockToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MOCK_TOKEN_KEY, MOCK_TOKEN_VALUE);
  }

  static clearMockToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(MOCK_TOKEN_KEY);
  }
}
