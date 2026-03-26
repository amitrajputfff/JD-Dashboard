import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { toast } from 'sonner';

export const useOAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const loadingToastRef = useRef<string | number | null>(null);

  const resetOAuthState = useCallback(() => {
    setIsLoading(false);
    if (loadingToastRef.current !== null) {
      toast.dismiss(loadingToastRef.current);
      loadingToastRef.current = null;
    }
  }, []);

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'sso') => {
    setIsLoading(true);
    
    const providerName = provider === 'sso' ? 'SSO' : provider.charAt(0).toUpperCase() + provider.slice(1);
    const loadingToast = toast.loading(`Connecting to ${providerName}...`, {
      description: 'Redirecting to secure authentication'
    });
    loadingToastRef.current = loadingToast;
    
    try {
      let oauthUrl: string;
      
      // Handle Google OAuth specifically
      if (provider === 'google') {
        const response = await authApi.getGoogleAuthUrl();
        oauthUrl = response.auth_url;
      } else {
        // Get the OAuth URL for other providers
        oauthUrl = await authApi.getOAuthUrl(provider);
      }
      
      toast.loading(`Opening ${providerName} login...`, {
        id: loadingToast,
        description: 'You will be redirected to complete authentication'
      });
      
      // Small delay to show the toast
      setTimeout(() => {
        window.location.href = oauthUrl;
      }, 500);
      
    } catch (error) {
      console.error(`${provider} OAuth error:`, error);
      
      toast.error(`${providerName} Login Failed`, {
        id: loadingToast,
        description: error instanceof Error ? error.message : `Unable to connect to ${providerName}. Please try again.`,
        action: {
          label: 'Try Again',
          onClick: () => handleOAuthLogin(provider)
        }
      });
      resetOAuthState();
    }
  };

  const handleOAuthCallback = async (provider: 'google' | 'github' | 'sso', code: string, state?: string) => {
    setIsLoading(true);
    
    const providerName = provider === 'sso' ? 'SSO' : provider.charAt(0).toUpperCase() + provider.slice(1);
    const loadingToast = toast.loading(`Completing ${providerName} login...`, {
      description: 'Processing authentication response'
    });
    
    try {
      const response = await authApi.oauthLogin(provider, code, state);
      
      // Fetch fresh user data from /me API to ensure we have the latest info
      toast.loading('Loading your profile...', {
        id: loadingToast,
        description: 'Fetching your latest account information'
      });

      try {
        const freshUserData = await authApi.getCurrentUser();
        if (freshUserData) {
          // Update localStorage with fresh data from /me API
          // Note: authApi.getCurrentUser() already updates localStorage internally
        }
      } catch (meError) {
        console.warn('Failed to fetch fresh user data after OAuth login:', meError);
        // Continue with login even if /me fails - we have user data from OAuth response
      }
      
      const userName = response.user.name || response.user.email?.split('@')[0] || 'User';
      const successMessage = response.message || `Successfully signed in with ${providerName}`;
      
      toast.success(`Welcome back! 🎉`, {
        id: loadingToast,
        description: `${successMessage} - Signed in as ${userName}`,
        duration: 4000,
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } catch (error) {
      console.error(`${provider} OAuth callback error:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during OAuth login';
      
      if (errorMessage.toLowerCase().includes('cancelled') || errorMessage.toLowerCase().includes('denied')) {
        toast.error('Login Cancelled', {
          id: loadingToast,
          description: `${providerName} authentication was cancelled. You can try again anytime.`,
          action: {
            label: 'Try Again',
            onClick: () => handleOAuthLogin(provider)
          }
        });
      } else if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('expired')) {
        toast.error('Authentication Failed', {
          id: loadingToast,
          description: `${providerName} authentication failed. Please try signing in again.`,
          action: {
            label: 'Retry Login',
            onClick: () => handleOAuthLogin(provider)
          }
        });
      } else {
        toast.error(`${providerName} Login Failed`, {
          id: loadingToast,
          description: errorMessage,
          action: {
            label: 'Contact Support',
            onClick: () => {
              window.open('mailto:admin@justdial.com?subject=OAuth Login Issue&body=Error: ' + encodeURIComponent(errorMessage), '_blank')
            }
          }
        });
      }
      
      // Redirect back to login page after a delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } finally {
      loadingToastRef.current = null;
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleOAuthLogin,
    handleOAuthCallback,
    resetOAuthState
  };
};
