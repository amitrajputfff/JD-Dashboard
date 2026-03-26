// OAuth Configuration
// This file contains configuration for OAuth providers
// You can customize these settings based on your backend implementation

export const OAUTH_CONFIG = {
  // Base API URL for OAuth endpoints
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  
  // OAuth endpoints
  endpoints: {
    google: '/api/auth/google/url',
    github: '/api/auth/oauth/github',
    sso: '/api/auth/oauth/sso',
    callback: '/api/auth/oauth/callback'
  },
  
  // Redirect URI for OAuth callbacks
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
  
  // OAuth provider display names
  providers: {
    google: {
      name: 'Google',
      displayName: 'Continue with Google',
      icon: 'google'
    },
    github: {
      name: 'GitHub',
      displayName: 'Continue with GitHub',
      icon: 'github'
    },
    sso: {
      name: 'SSO',
      displayName: 'Continue with SSO',
      icon: 'key'
    }
  }
} as const;

// Helper function to get OAuth URL for a provider
export const getOAuthUrl = async (provider: 'google' | 'github' | 'sso'): Promise<string> => {
  const { baseUrl, endpoints, redirectUri } = OAUTH_CONFIG;
  const endpoint = endpoints[provider];
  
  if (!endpoint) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
  
  // For Google, we need to make an API call to get the auth URL
  if (provider === 'google') {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get Google OAuth URL: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.auth_url) {
        throw new Error('Invalid response: missing auth_url');
      }
      
      // Store the state parameter for later verification
      if (data.state && typeof window !== 'undefined') {
        sessionStorage.setItem('google_oauth_state', data.state);
      }
      
      return data.auth_url;
    } catch (error) {
      console.error('Error getting Google OAuth URL:', error);
      throw new Error(`Failed to get Google OAuth URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // For other providers, use the old method
  const url = new URL(endpoint, baseUrl);
  url.searchParams.set('redirect_uri', redirectUri);
  
  return url.toString();
};
