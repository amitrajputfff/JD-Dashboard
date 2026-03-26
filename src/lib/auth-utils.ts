import { AuthValidator } from './auth-validation';
import { authStorage } from './auth-storage';
import { User } from '@/types/auth';

/**
 * Utility functions for authentication validation and management
 */
export const authUtils = {
  /**
   * Validates authentication and redirects to login if invalid
   * @param redirectToLogin Function to call for redirect
   * @returns Promise<boolean> - true if valid, false if invalid
   */
  async validateAndRedirect(redirectToLogin: () => void): Promise<boolean> {
    try {
      const result = await AuthValidator.validateAndRestore(redirectToLogin);
      return result.isValid;
    } catch (error) {
      console.error('Auth validation error:', error);
      redirectToLogin();
      return false;
    }
  },

  /**
   * Quick check if user has basic authentication tokens
   * @returns boolean
   */
  hasTokens(): boolean {
    return AuthValidator.hasBasicAuth();
  },

  /**
   * Check if user has valid user data
   * @returns boolean
   */
  hasUserData(): boolean {
    return AuthValidator.hasValidUserData();
  },

  /**
   * Get current user from storage (without validation)
   * @returns User | null
   */
  getCurrentUser() {
    return authStorage.getUser();
  },

  /**
   * Get access token from storage
   * @returns string | null
   */
  getAccessToken(): string | null {
    return authStorage.getAccessToken();
  },

  /**
   * Get refresh token from storage
   * @returns string | null
   */
  getRefreshToken(): string | null {
    return authStorage.getRefreshToken();
  },

  /**
   * Clear all authentication data
   */
  clearAuth(): void {
    authStorage.clear();
  },

  /**
   * Check if authentication is complete (has tokens and user data)
   * @returns boolean
   */
  isFullyAuthenticated(): boolean {
    return this.hasTokens() && this.hasUserData();
  },

  /**
   * Validate authentication state and return detailed result
   * @returns Promise<ValidationResult>
   */
  async validateAuth() {
    return AuthValidator.validateAuth();
  },

  /**
   * Check if current user has a specific permission
   * @param permission Permission name to check (e.g., 'user.create', 'assistant.read')
   * @returns boolean
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user?.permissions) return false;
    
    return user.permissions.effective_permissions.includes(permission);
  },

  /**
   * Check if current user has any of the specified permissions
   * @param permissions Array of permission names to check
   * @returns boolean
   */
  hasAnyPermission(permissions: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user?.permissions) return false;
    
    return permissions.some(permission => 
      user.permissions!.effective_permissions.includes(permission)
    );
  },

  /**
   * Check if current user has all of the specified permissions
   * @param permissions Array of permission names to check
   * @returns boolean
   */
  hasAllPermissions(permissions: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user?.permissions) return false;
    
    return permissions.every(permission => 
      user.permissions!.effective_permissions.includes(permission)
    );
  },

  /**
   * Check if current user has a specific role
   * @param roleName Role name to check (e.g., 'super_admin', 'org_admin')
   * @returns boolean
   */
  hasRole(roleName: string): boolean {
    const user = this.getCurrentUser();
    if (!user?.permissions?.roles) return false;
    
    return user.permissions.roles.some(userRole => 
      userRole.is_active && userRole.role.name === roleName
    );
  },

  /**
   * Check if current user has any of the specified roles
   * @param roleNames Array of role names to check
   * @returns boolean
   */
  hasAnyRole(roleNames: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user?.permissions?.roles) return false;
    
    return user.permissions.roles.some(userRole => 
      userRole.is_active && roleNames.includes(userRole.role.name)
    );
  },

  /**
   * Get all effective permissions for current user
   * @returns string[] Array of permission names
   */
  getEffectivePermissions(): string[] {
    const user = this.getCurrentUser();
    return user?.permissions?.effective_permissions || [];
  },

  /**
   * Get all active roles for current user
   * @returns Array of role names
   */
  getActiveRoles(): string[] {
    const user = this.getCurrentUser();
    if (!user?.permissions?.roles) return [];
    
    return user.permissions.roles
      .filter(userRole => userRole.is_active)
      .map(userRole => userRole.role.name);
  },

  /**
   * Check if current user is a system admin
   * @returns boolean
   */
  isSystemAdmin(): boolean {
    return this.hasPermission('system.admin') || this.hasRole('super_admin');
  },

  /**
   * Check if current user is an organization admin
   * @returns boolean
   */
  isOrgAdmin(): boolean {
    return this.hasRole('org_admin') || this.isSystemAdmin();
  },

  /**
   * Get organization ID from current user
   * @returns string | null - organization ID or null if not available
   */
  getOrganizationId(): string | null {
    const user = this.getCurrentUser();
    return user?.organization_id || null;
  }
};

/**
 * Hook for checking authentication state on demand
 * Can be used in components that need to validate auth without using the full useAuth hook
 */
export function useAuthValidation() {
  const validateAuth = async () => {
    return AuthValidator.validateAuth();
  };

  const hasTokens = () => authUtils.hasTokens();
  const hasUserData = () => authUtils.hasUserData();
  const isFullyAuthenticated = () => authUtils.isFullyAuthenticated();

  return {
    validateAuth,
    hasTokens,
    hasUserData,
    isFullyAuthenticated,
    getCurrentUser: authUtils.getCurrentUser,
    getAccessToken: authUtils.getAccessToken,
    getRefreshToken: authUtils.getRefreshToken,
    clearAuth: authUtils.clearAuth
  };
}
