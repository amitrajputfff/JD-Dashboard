import { useState, useCallback } from 'react';

export interface Organization {
  id: string;
  name: string;
}

export interface UseOrganizationsReturn {
  organizations: Record<string, Organization>;
  isLoading: boolean;
  error: string | null;
  getOrganizationName: (orgId: string) => string;
  getOrganizationShortName: (orgId: string) => string;
  fetchOrganization: (orgId: string) => Promise<void>;
  fetchOrganizations: (orgIds: string[]) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

const MOCK_ORGANIZATIONS: Record<string, Organization> = {
  'org-demo-123': { id: 'org-demo-123', name: 'Demo Organization' },
};

export function useOrganizations(): UseOrganizationsReturn {
  const [organizations, setOrganizations] = useState<Record<string, Organization>>(MOCK_ORGANIZATIONS);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const fetchOrganization = useCallback(async (orgId: string) => {
    // Return mock data; if unknown ID, derive a placeholder name
    if (!organizations[orgId]) {
      setOrganizations((prev) => ({
        ...prev,
        [orgId]: { id: orgId, name: 'Demo Organization' },
      }));
    }
  }, [organizations]);

  const fetchOrganizations = useCallback(async (orgIds: string[]) => {
    const updates: Record<string, Organization> = {};
    orgIds.forEach((orgId) => {
      if (!organizations[orgId]) {
        updates[orgId] = { id: orgId, name: 'Demo Organization' };
      }
    });
    if (Object.keys(updates).length > 0) {
      setOrganizations((prev) => ({ ...prev, ...updates }));
    }
  }, [organizations]);

  const refreshOrganizations = useCallback(async () => {
    setOrganizations(MOCK_ORGANIZATIONS);
  }, []);

  const getOrganizationName = useCallback((orgId: string): string => {
    const org = organizations[orgId];
    if (org) {
      return org.name;
    }
    const shortId = orgId.substring(0, 8);
    return `Organization ${shortId.toUpperCase()}`;
  }, [organizations]);

  const getOrganizationShortName = useCallback((orgId: string): string => {
    const fullName = getOrganizationName(orgId);
    if (fullName.includes(' ')) {
      const words = fullName.split(' ');
      return words.length > 1 ? `${words[0]} ${words[1].charAt(0)}.` : words[0];
    }
    return fullName;
  }, [getOrganizationName]);

  return {
    organizations,
    isLoading,
    error,
    getOrganizationName,
    getOrganizationShortName,
    fetchOrganization,
    fetchOrganizations,
    refreshOrganizations,
  };
}
