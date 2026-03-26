"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/auth';
import { authStorage } from '@/lib/auth-storage';
import { AuthValidator } from '@/lib/auth-validation';

const MOCK_USER: User = {
  id: 1,
  email: 'admin@demo.com',
  name: 'Demo Admin',
  phone_number: null,
  is_active: true,
  organization_id: 'org-demo-123',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  organization: { id: 'org-demo-123', name: 'Demo Organization' },
  permissions: {
    user_id: 1,
    roles: [],
    role_permissions: ['system.admin'],
    granted_permissions: ['system.admin'],
    denied_permissions: [],
    effective_permissions: [
      'system.admin',
      'organization.read',
      'organization.update',
      'organization.delete',
    ],
    field_permissions: {},
  },
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const handleLogout = useCallback((shouldRedirect: boolean = true) => {
    setUser(null);
    AuthValidator.clearMockToken();
    authStorage.clear();
    if (shouldRedirect && typeof window !== 'undefined') {
      router.push('/login');
    }
  }, [router]);

  const logout = useCallback(async () => {
    handleLogout(true);
  }, [handleLogout]);

  const refreshUserData = useCallback(async () => {
    const cached = authStorage.getUser();
    if (cached) setUser(cached);
  }, []);

  const refreshTokens = useCallback(async () => {
    // No-op for mock auth
  }, []);

  const refreshSessionsOnly = useCallback(async () => {
    // No-op for mock auth
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthed = AuthValidator.hasBasicAuth();
      if (isAuthed) {
        const cached = authStorage.getUser();
        setUser(cached || MOCK_USER);
        if (!cached) authStorage.setUser(MOCK_USER);
      }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    sessions: [],
    isLoading,
    error: null,
    logout,
    refreshUserData,
    refreshTokens,
    refreshSessionsOnly,
    isAuthenticated: AuthValidator.hasBasicAuth() && !!user,
  };
}
