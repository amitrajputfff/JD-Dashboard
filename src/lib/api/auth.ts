import { apiClient } from './client';
import { LoginRequest, RegisterRequest, RegisterResponse, AuthResponse, User, Session, OAuthLoginRequest, OAuthLoginResponse, UserPermissions } from '@/types/auth';
import { authStorage } from '@/lib/auth-storage';
import { getOAuthUrl } from '@/lib/oauth-config';
import axios from 'axios';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const loginData = {
        email: credentials.email,
        password: credentials.password,
        recaptcha_token: credentials.recaptcha_token,
        remember_me: credentials.remember_me
      };

      const response = await apiClient.post<{
        token: string;
        refresh_token: string;
        user: User;
      }>('/api/auth/login', loginData);
      
      // Check if response has the expected structure
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      const data = response.data;
      
      // Validate required fields
      if (!data.token) {
        throw new Error('No access token received');
      }
      
      if (!data.refresh_token) {
        throw new Error('No refresh token received');
      }
      
      if (!data.user) {
        throw new Error('No user data received');
      }
      
      // Store tokens in localStorage (client-side only)  
      if (typeof window !== 'undefined') {
        authStorage.setAccessToken(data.token);
        authStorage.setRefreshToken(data.refresh_token);
        authStorage.setUser(data.user);
      }
      
      // Return in the expected AuthResponse format
      return {
        access_token: data.token,
        refresh_token: data.refresh_token,
        token_type: 'Bearer',
        user: data.user,
        message: 'Login successful'
      } as AuthResponse;
    } catch (error: unknown) {
      // Handle different error structures
      if (error && typeof error === 'object') {
        const apiError = error as any;
        
        // First, check if error has a direct message field
        if (apiError.message && typeof apiError.message === 'string') {
          throw new Error(apiError.message);
        }
        
        // Then check for axios response structure
        if ('response' in apiError && apiError.response?.data) {
          const responseData = apiError.response.data;
          
          // Check for detail field (most common API error format)
          if (responseData.detail && typeof responseData.detail === 'string') {
            throw new Error(responseData.detail);
          }
          
          // Check for message field in response data
          if (responseData.message && typeof responseData.message === 'string') {
            throw new Error(responseData.message);
          }
          
          // Check for error field
          if (responseData.error && typeof responseData.error === 'string') {
            throw new Error(responseData.error);
          }
          
          // If responseData is a string, use it directly
          if (typeof responseData === 'string') {
            throw new Error(responseData);
          }
        }
      }
      
      // If it's already an Error object, re-throw it
      if (error instanceof Error) {
        throw error;
      }
      
      // Last resort fallback
      throw new Error('An unexpected error occurred during login');
    }
  },

  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    try {
      const registerData = {
        email: userData.email,
        password: userData.password,
        confirm_password: userData.confirm_password,
        name: userData.name,
        organization_name: userData.organization_name,
        phone_number: userData.phone_number,
        recaptcha_token: userData.recaptcha_token
      };

      const response = await apiClient.post<RegisterResponse>('/api/auth/register', registerData, {
        timeout: 90000, // 90 seconds for signup specifically
        maxContentLength: 50 * 1024 * 1024, // 50MB max content length
        maxBodyLength: 50 * 1024 * 1024 // 50MB max body length
      });
      
      // Check if response has the expected structure
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      const responseData = response.data;
      
      // Validate the response structure - the response is directly {user: {...}, verification_sent: true}
      if (!responseData.user) {
        throw new Error('Invalid response structure from server');
      }
      
      // Validate required user fields
      const userData_response = responseData.user;
      if (typeof userData_response.id !== 'number' || 
          typeof userData_response.email !== 'string' ||
          typeof userData_response.organization_id !== 'string') {
        throw new Error('Invalid user data in response');
      }
      
      // Create a User object that matches our User interface
      // Note: Registration response may not include all fields, so we use defaults for missing ones
      const user: User = {
        id: userData_response.id,
        email: userData_response.email,
        name: userData_response.name || userData.name,
        organization_id: userData_response.organization_id,
        is_active: true, // Default to active for new registrations
        created_at: new Date().toISOString(), // Use current time as fallback
        updated_at: new Date().toISOString(), // Use current time as fallback
        email_verified: userData_response.email_verified || false
      };
      
      // Store user data in localStorage (client-side only)
      if (typeof window !== 'undefined') {
        authStorage.setUser(user);
      }
      
      // Add the message/detail from the response for success toast
      const responseWithMessage = {
        ...responseData,
        message: responseData.message || 'Account created successfully'
      };
      
      return responseWithMessage;
    } catch (error: unknown) {
      // Handle different error structures
      if (error && typeof error === 'object') {
        const apiError = error as any;
        
        // Handle timeout errors specifically
        if (apiError.code === 'ECONNABORTED' || apiError.message?.includes('timeout')) {
          throw new Error('Request timed out. The server might be busy. Please try again in a moment.');
        }
        
        // Handle network errors
        if (apiError.code === 'NETWORK_ERROR' || apiError.message?.includes('Network Error')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        
        // First, check if error has a direct message field (like the current case)
        if (apiError.message && typeof apiError.message === 'string') {
          throw new Error(apiError.message);
        }
        
        // Then check for axios response structure
        if ('response' in apiError && apiError.response?.data) {
          const responseData = apiError.response.data;
          
          // Check for detail field (most common API error format)
          if (responseData.detail && typeof responseData.detail === 'string') {
            throw new Error(responseData.detail);
          }
          
          // Check for message field in response data
          if (responseData.message && typeof responseData.message === 'string') {
            throw new Error(responseData.message);
          }
          
          // Check for error field
          if (responseData.error && typeof responseData.error === 'string') {
            throw new Error(responseData.error);
          }
          
          // If responseData is a string, use it directly
          if (typeof responseData === 'string') {
            throw new Error(responseData);
          }
        }
      }
      
      // If it's already an Error object, re-throw it
      if (error instanceof Error) {
        throw error;
      }
      
      // Last resort fallback
      throw new Error('An unexpected error occurred during registration');
    }
  },

  // Refresh access token using current access token
  refreshToken: async (): Promise<{access_token: string, refresh_token: string, token_type: string, user: User}> => {
    try {
      const accessToken = authStorage.getAccessToken();
      const refreshToken = authStorage.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available for refresh');
      }

      // Create a direct axios instance to avoid circular dependency with the interceptor
      // This prevents the refresh token call from triggering the 401 interceptor
      const refreshClient = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      // Make the refresh request with refresh token in body
      // Include access token in headers if available, but don't require it
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await refreshClient.post<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        user: User;
      }>('/api/auth/refresh', {
        refresh_token: refreshToken
      }, {
        headers
      });

      // Validate response
      if (!response?.data?.access_token) {
        throw new Error('No access token received from refresh');
      }

      const responseData = response.data;

      // Store new tokens in localStorage
      if (typeof window !== 'undefined') {
        authStorage.setAccessToken(responseData.access_token);
        if (responseData.refresh_token) {
          authStorage.setRefreshToken(responseData.refresh_token);
        }
        if (responseData.user) {
          authStorage.setUser(responseData.user);
        }
      }

      // Return the new auth response
      return {
        access_token: responseData.access_token,
        refresh_token: responseData.refresh_token || refreshToken || '', // Use new refresh token if provided, otherwise keep old one
        token_type: responseData.token_type || 'Bearer',
        user: responseData.user
      };

    } catch (error: unknown) {
      console.error('Token refresh failed:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        if (apiError.response?.status === 401) {
          console.error('Access token is invalid or expired');
        } else if (apiError.response?.status === 403) {
          console.error('Access token lacks refresh permissions');
        } else if (apiError.response?.status >= 500) {
          console.error('Server error during token refresh');
        }
      }
      
      // If refresh fails, clear tokens and throw error
      if (typeof window !== 'undefined') {
        authStorage.clearTokens();
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      throw new Error(errorMessage);
    }
  },

  // Get organization details by ID
  getOrganization: async (organizationId: string): Promise<{ id: string; name: string }> => {
    try {
      const response = await apiClient.get<{
        id: string;
        name: string;
        created_by: string | null;
        created_at: string;
        updated_at: string;
      }>(`/api/organizations/${organizationId}`);
      
      // Handle different response structures
      let orgData: { id: string; name: string; created_by: string | null; created_at: string; updated_at: string; };
      if (response && typeof response === 'object' && 'id' in response) {
        // Direct organization object response
        orgData = response as any;
      } else if (response && typeof response === 'object' && 'data' in response && response.data) {
        // Nested data structure
        orgData = response.data as any;
      } else {
        throw new Error('Invalid organization response structure');
      }
      
      return {
        id: String(orgData.id),
        name: String(orgData.name)
      };
    } catch (error: unknown) {
      // Don't return fallback, let the calling code handle the error
      throw error;
    }
  },


  logout: async (): Promise<void> => {
    try {
      const accessToken = authStorage.getAccessToken();
      const refreshToken = authStorage.getRefreshToken();
      
      if (accessToken && refreshToken) {
        // Make logout request with refresh token in body and Bearer token in headers
        await apiClient.post('/api/auth/logout', {
          refresh_token: refreshToken
        }, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
      }
      
      // Clear all auth data regardless of API response
      authStorage.clear();
    } catch (error: unknown) {
      // Even if logout fails on server, clear local storage
      authStorage.clear();
      
      // Log the error but don't prevent logout
      console.warn('Logout API call failed, but local session cleared:', error);
      
      // Don't throw error - logout should always succeed locally
      // throw new Error(error instanceof Error ? error.message : 'Logout failed');
    }
  },

  updateUser: async (userId: number, updateData: { name?: string; phone_number?: string }): Promise<User> => {
    try {
      const response = await apiClient.put<User>(`/api/users/${userId}`, updateData);
      
      // The API returns the updated user object directly
      let userData: User;
      
      // Handle the response structure from apiClient
      if (response && typeof response === 'object' && 'data' in response) {
        // apiClient wraps response in .data
        const responseData = response.data;
        
        // Check if the user data is nested inside a 'user' property
        if (responseData && typeof responseData === 'object' && 'user' in responseData) {
          userData = responseData.user as User;
        } else {
          userData = responseData as User;
        }
      } else {
        // Direct response
        userData = response as User;
      }
      
      // Validate the user data matches the expected structure
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data received from API');
      }
      
      // Only check for absolutely essential fields - be more lenient
      if (!userData.id || !userData.email) {
        throw new Error('Incomplete user data received from API - missing id or email');
      }
      
      // Fill in missing optional fields with defaults
      if (!userData.name) {
        userData.name = userData.email.split('@')[0];
      }
      
      // Try to fetch organization details if organization_id is available
      if (userData.organization_id) {
        try {
          const organization = await authApi.getOrganization(userData.organization_id);
          userData = {
            ...userData,
            organization: {
              id: organization.id,
              name: organization.name
            }
          };
        } catch (orgError) {
          console.warn('Failed to fetch organization details for updated user:', orgError);
          // Continue without organization details - not critical for user update
        }
      }
      
      // Fetch user permissions
      try {
        const permissions = await authApi.getUserPermissions();
        userData = {
          ...userData,
          permissions: permissions
        };
      } catch (permError) {
        console.warn('Failed to fetch user permissions after update:', permError);
        // Continue without permissions - not critical for user update
        // Set empty permissions structure as fallback
        userData.permissions = {
          user_id: userData.id,
          roles: [],
          role_permissions: [],
          granted_permissions: [],
          denied_permissions: [],
          effective_permissions: [],
          field_permissions: {}
        };
      }
      
      // Store the updated user data in localStorage
      if (typeof window !== 'undefined') {
        authStorage.setUser(userData);
      }
      
      return userData;
    } catch (error: unknown) {
      console.error('updateUser error:', error);
      
      // Handle different error structures
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.detail) {
          throw new Error(axiosError.response.data.detail);
        } else if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        } else if (axiosError.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (axiosError.response?.status === 403) {
          throw new Error('You do not have permission to update this user.');
        } else if (axiosError.response?.status === 404) {
          throw new Error('User not found.');
        } else if (axiosError.response?.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
      }
      
      // Handle network errors
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('Network Error') || errorMessage.includes('timeout')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
        throw new Error(errorMessage);
      }
      
      throw new Error('Failed to update user information');
    }
  },

  changePassword: async (passwordData: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string; data: null; error: null }>('/api/auth/change-password', passwordData);
      
      // Handle the response structure from apiClient
      let responseData: { message: string; data: null; error: null };
      
      if (response && typeof response === 'object' && 'data' in response) {
        // apiClient wraps response in .data
        responseData = response.data as { message: string; data: null; error: null };
      } else {
        // Direct response
        responseData = response as { message: string; data: null; error: null };
      }
      
      // Return the message from the response
      return { message: responseData.message };
    } catch (error: unknown) {
      console.error('changePassword error:', error);
      
      // Handle different error structures
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.detail) {
          throw new Error(axiosError.response.data.detail);
        } else if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        } else if (axiosError.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (axiosError.response?.status === 400) {
          throw new Error('Invalid password data provided.');
        } else if (axiosError.response?.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
      }
      
      // Handle network errors
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('Network Error') || errorMessage.includes('timeout')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
        throw new Error(errorMessage);
      }
      
      throw new Error('Failed to change password');
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await apiClient.get<User>('/api/auth/me');
      
      // The API returns the user object directly
      let userData: User;
      
      // Handle the response structure from apiClient
      if (response && typeof response === 'object' && 'data' in response) {
        // apiClient wraps response in .data
        userData = response.data as User;
      } else {
        // Direct response
        userData = response as User;
      }
      
      // Validate the user data matches the expected structure
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data received from API');
      }
      
      // Only check for absolutely essential fields - be more lenient
      if (!userData.id || !userData.email) {
        throw new Error('Incomplete user data received from API - missing id or email');
      }
      
      // Log missing optional fields but don't throw errors
      const optionalFields = ['name', 'phone_number', 'is_active', 'organization_id', 'created_at', 'updated_at'];
      const missingOptionalFields = optionalFields.filter(field => !(field in userData));
      
      if (missingOptionalFields.length > 0) {
        console.warn('getCurrentUser: Missing optional fields in API response:', missingOptionalFields);
        // Fill in default values for missing optional fields
        if (!userData.name) userData.name = userData.email.split('@')[0];
        if (!userData.phone_number) userData.phone_number = null;
        if (userData.is_active === undefined) userData.is_active = true;
        if (!userData.organization_id) userData.organization_id = '';
        if (!userData.created_at) userData.created_at = new Date().toISOString();
        if (!userData.updated_at) userData.updated_at = new Date().toISOString();
      }
      
      // Try to fetch organization details if organization_id is available
      if (userData.organization_id) {
        try {
          const organization = await authApi.getOrganization(userData.organization_id);
          userData = {
            ...userData,
            organization: {
              id: organization.id,
              name: organization.name
            }
          };
        } catch (orgError) {
          console.warn('Failed to fetch organization details for current user:', orgError);
          // Continue without organization details - not critical for user authentication
        }
      }
      
      // Fetch user permissions
      try {
        const permissions = await authApi.getUserPermissions();
        userData = {
          ...userData,
          permissions: permissions
        };
      } catch (permError) {
        console.warn('Failed to fetch user permissions:', permError);
        // Continue without permissions - not critical for basic user authentication
        // Set empty permissions structure as fallback
        userData.permissions = {
          user_id: userData.id,
          roles: [],
          role_permissions: [],
          granted_permissions: [],
          denied_permissions: [],
          effective_permissions: [],
          field_permissions: {}
        };
      }
      
      // Store the user data in localStorage
      if (typeof window !== 'undefined') {
        authStorage.setUser(userData);
      }
      
      return userData;
    } catch (error: unknown) {
      console.error('getCurrentUser error:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        if (apiError.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (apiError.response?.status === 403) {
          throw new Error('Access denied. Please check your permissions.');
        } else if (apiError.response?.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to get current user');
    }
  },

  getUserPermissions: async (): Promise<UserPermissions> => {
    try {
      const response = await apiClient.get<UserPermissions>('/api/permissions/me');
      
      // The API returns the permissions object directly
      let permissionsData: UserPermissions;
      
      // Handle the response structure from apiClient
      if (response && typeof response === 'object' && 'data' in response) {
        // apiClient wraps response in .data
        permissionsData = response.data as UserPermissions;
      } else {
        // Direct response
        permissionsData = response as UserPermissions;
      }
      
      // Validate the permissions data matches the expected structure
      if (!permissionsData || typeof permissionsData !== 'object') {
        throw new Error('Invalid permissions data received from API');
      }
      
      // Only check for essential fields
      if (!permissionsData.user_id || !Array.isArray(permissionsData.roles)) {
        throw new Error('Incomplete permissions data received from API - missing user_id or roles');
      }
      
      // Ensure arrays exist even if empty
      if (!Array.isArray(permissionsData.effective_permissions)) {
        permissionsData.effective_permissions = [];
      }
      if (!Array.isArray(permissionsData.role_permissions)) {
        permissionsData.role_permissions = [];
      }
      if (!Array.isArray(permissionsData.granted_permissions)) {
        permissionsData.granted_permissions = [];
      }
      if (!Array.isArray(permissionsData.denied_permissions)) {
        permissionsData.denied_permissions = [];
      }
      if (!permissionsData.field_permissions) {
        permissionsData.field_permissions = {};
      }
      
      return permissionsData;
    } catch (error: unknown) {
      console.error('getUserPermissions error:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        if (apiError.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (apiError.response?.status === 403) {
          throw new Error('Access denied. Please check your permissions.');
        } else if (apiError.response?.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to get user permissions');
    }
  },

  getSessions: async (): Promise<Session[]> => {
    try {
      
      const data = await apiClient.get('/api/auth/sessions');
      
      
      // Handle different response structures
      let sessions: Session[];
      
      if (Array.isArray(data)) {
        // Direct array response
        sessions = data as Session[];
        
      } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
        // Nested data structure
        sessions = data.data as Session[];
        
      } else {
        console.warn('getSessions: Unexpected response structure:', data);
        sessions = [];
      }
      
      
      
      // Store sessions in localStorage for caching
      if (typeof window !== 'undefined') {
        authStorage.setSessions(sessions);
      }
      
      return sessions;
    } catch (error) {
      console.error('getSessions: Error fetching sessions:', error);
      // Return empty array instead of throwing error
      return [];
    }
  },

  revokeSession: async (sessionId: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/auth/sessions/${sessionId}`);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to revoke session');
    }
  },

  revokeAllSessions: async (): Promise<void> => {
    try {
      await apiClient.delete('/api/auth/sessions');
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to revoke all sessions');
    }
  },

  isAuthenticated: (): boolean => {
    return authStorage.isAuthenticated();
  },

  getStoredUser: (): User | null => {
    return authStorage.getUser();
  },

  getStoredSessions: (): Session[] => {
    return authStorage.getSessions();
  },

  // OAuth methods
  getOAuthUrl: async (provider: 'google' | 'github' | 'sso'): Promise<string> => {
    return await getOAuthUrl(provider);
  },

  // Google OAuth specific methods
  getGoogleAuthUrl: async (): Promise<{ auth_url: string; state: string }> => {
    try {
      const response = await apiClient.get<{ auth_url: string; state: string }>('/api/auth/google/url');
      
      if (!response.auth_url || !response.state) {
        throw new Error('Invalid response from Google OAuth URL endpoint');
      }
      
      // Store the state parameter for later verification
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('google_oauth_state', response.state);
      }
      
      return response;
    } catch (error: unknown) {
      console.error('Error getting Google OAuth URL:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        if (apiError.response?.data?.detail) {
          throw new Error(apiError.response.data.detail);
        } else if (apiError.response?.data?.message) {
          throw new Error(apiError.response.data.message);
        }
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to get Google OAuth URL');
    }
  },

  handleGoogleCallback: async (code: string, state?: string): Promise<OAuthLoginResponse> => {
    try {
      // Verify the state parameter for security
      if (state && typeof window !== 'undefined') {
        const storedState = sessionStorage.getItem('google_oauth_state');
        if (storedState !== state) {
          throw new Error('Invalid state parameter. Possible CSRF attack.');
        }
        // Clear the stored state after verification
        sessionStorage.removeItem('google_oauth_state');
      }

      // Build query parameters for GET request
      // Note: URLSearchParams automatically handles URL encoding, so we don't need to double-encode
      const queryParams = new URLSearchParams();
      queryParams.append('code', code);
      if (state) {
        queryParams.append('state', state);
      }

      const response = await apiClient.get<{
        message: string;
        data: {
          token: string;
          refresh_token: string;
          user: User & {
            is_oauth_user: boolean;
            oauth_provider: string | null;
            profile_picture: string | null;
          };
        };
        error: null;
      }>(`/api/auth/google/callback?${queryParams.toString()}`);
      
      // Extract the actual data from the API response wrapper
      const authData = response.data;
      
      // Store tokens in localStorage
      if (typeof window !== 'undefined') {
        authStorage.setAccessToken(authData.token);
        authStorage.setRefreshToken(authData.refresh_token);
        authStorage.setUser(authData.user);
      }
      
      return {
        access_token: authData.token,
        refresh_token: authData.refresh_token,
        token_type: 'Bearer',
        user: authData.user
      };
    } catch (error: unknown) {
      console.error('Google OAuth callback error:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        if (apiError.response?.data?.detail) {
          throw new Error(apiError.response.data.detail);
        } else if (apiError.response?.data?.message) {
          throw new Error(apiError.response.data.message);
        }
      }
      
      throw new Error(error instanceof Error ? error.message : 'Google OAuth callback failed');
    }
  },

  oauthLogin: async (provider: 'google' | 'github' | 'sso', code: string, state?: string): Promise<OAuthLoginResponse> => {
    try {
      // Handle Google OAuth specifically
      if (provider === 'google') {
        return await authApi.handleGoogleCallback(code, state);
      }
      
      // For other providers, use the existing method
      const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '';
      
      const oauthData: OAuthLoginRequest = {
        provider,
        code,
        state,
        redirect_uri: redirectUri
      };

      const response = await apiClient.post<OAuthLoginResponse>('/api/auth/oauth/callback', oauthData);
      
      // Store tokens in localStorage
      if (typeof window !== 'undefined') {
        authStorage.setAccessToken(response.data.access_token);
        authStorage.setRefreshToken(response.data.refresh_token);
        authStorage.setUser(response.data.user);
      }
      
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth login failed';
      throw new Error(errorMessage);
    }
  },

  // Email verification methods
  verifyEmail: async (data: { token: string }): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/api/auth/verify-email', data);
      return response;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        if (apiError.response?.data?.detail) {
          throw new Error(apiError.response.data.detail);
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Email verification failed');
    }
  },

  resendVerificationEmail: async (data: { email: string }): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/api/auth/resend-verification', data);
      return response;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        if (apiError.response?.data?.detail) {
          throw new Error(apiError.response.data.detail);
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to resend verification email');
    }
  },

  // Password reset methods
  forgotPassword: async (data: { email: string }): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/api/auth/forgot-password', data);
      return response;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        if (apiError.response?.data?.detail) {
          throw new Error(apiError.response.data.detail);
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to send password reset instructions');
    }
  },

  resendOtp: async (data: { email: string }): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/api/auth/resend-otp', data);
      return response;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        if (apiError.response?.data?.detail) {
          throw new Error(apiError.response.data.detail);
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to resend OTP');
    }
  },


  resetPassword: async (data: { 
    email: string; 
    otp: string; 
    new_password: string; 
    confirm_password: string;
  }): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/api/auth/reset-password', data);
      return response;
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      
      // Handle ApiError objects from the client
      if (error && typeof error === 'object' && 'message' in error) {
        const apiError = error as { message: string };
        console.error('API error message:', apiError.message);
        throw new Error(apiError.message);
      }
      
      // Handle axios error response
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        console.error('API error response:', {
          status: apiError.response?.status,
          data: apiError.response?.data,
          headers: apiError.response?.headers
        });
        
        if (apiError.response?.data?.detail) {
          throw new Error(apiError.response.data.detail);
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Password reset failed');
    }
  }
};
