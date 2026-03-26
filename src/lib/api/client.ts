import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { authStorage } from '@/lib/auth-storage';
import { ApiError, ApiResponse } from '@/types/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
      timeout: 60000, // Increased to 60 seconds for large payloads
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: false, // Add CORS configuration
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth
    this.client.interceptors.request.use(
      (config) => {
        // Ensure required headers are set for CORS
        config.headers = config.headers || {};
        
        // Only set Content-Type if it's not already set and data is not FormData
        // FormData needs to set its own Content-Type with boundary
        if (!(config.data instanceof FormData)) {
          config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
        } else {
          // For FormData, remove Content-Type to let the browser set it with boundary
          delete config.headers['Content-Type'];
        }
        
        config.headers['Accept'] = 'application/json';
        
        // SSR-safe token access
        if (typeof window !== 'undefined') {
          const token = authStorage.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        console.error('API Request Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        const originalRequest = error.config;
        
        // Handle 401 unauthorized - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
          originalRequest._retry = true;
          
          try {
            // Import dependencies here to avoid circular dependency
            const { authApi } = await import('./auth');
            const { authStorage } = await import('../auth-storage');
            
            // Check if we have a refresh token
            const refreshToken = authStorage.getRefreshToken();
            if (!refreshToken) {
              console.warn('No refresh token available - logging out');
              authStorage.clear();
              
              // Show toast notification
              if (typeof window !== 'undefined') {
                const { toast } = await import('sonner');
                toast.error('Session expired', {
                  description: 'Please log in again to continue',
                  duration: 4000
                });
              }
              
              window.location.href = '/login';
              return Promise.reject(error);
            }
            
            // Try to refresh the token
            const refreshResult = await authApi.refreshToken();
            
            if (refreshResult.access_token) {
              // Update the authorization header with the new token
              originalRequest.headers.Authorization = `Bearer ${refreshResult.access_token}`;
              
              // IMPORTANT: Update localStorage with the new token
              // The authApi.refreshToken() already updates localStorage, but we need to ensure
              // the request interceptor will use the updated token for future requests
              authStorage.setAccessToken(refreshResult.access_token);
              
              // Retry the original request
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed - logging out:', refreshError);
            
            // If refresh fails, clear tokens and redirect to login
            const { authStorage } = await import('../auth-storage');
            authStorage.clear();
            
            // Show toast notification
            if (typeof window !== 'undefined') {
              const { toast } = await import('sonner');
              toast.error('Session expired', {
                description: 'Your session has expired. Please log in again.',
                duration: 4000
              });
            }
            
            window.location.href = '/login';
            return Promise.reject(error);
          }
        }
        
        // Handle 403 forbidden - but only clear tokens for authentication errors, not permission errors
        if (error.response?.status === 403 && typeof window !== 'undefined') {
          // Check if this is a permission-related endpoint (permissions API)
          const isPermissionEndpoint = error.config?.url?.includes('/permissions');
          
          if (isPermissionEndpoint) {
            // For permission endpoints, don't log out - this is an authorization issue, not authentication
            const apiError: ApiError = {
              message: error.response?.data?.detail || error.response?.data?.message || 'You do not have permission to access this resource',
              code: error.response?.data?.code || error.code,
              details: error.response?.data?.details,
              status: 403,
              isPermissionError: true
            };
            
            return Promise.reject(apiError);
          } else {
            // For other endpoints, this is likely an authentication issue - clear tokens and redirect to login
            const { authStorage } = await import('../auth-storage');
            authStorage.clear();
            window.location.href = '/login';
            return Promise.reject(error);
          }
        }
        
        // Create standardized error response
        const apiError: ApiError = {
          message: error.response?.data?.detail || error.response?.data?.message || error.message || 'Something went wrong',
          code: error.response?.data?.code || error.code,
          details: error.response?.data?.details,
          status: error.response?.status,
          isPermissionError: false
        };
        
        return Promise.reject(apiError);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
