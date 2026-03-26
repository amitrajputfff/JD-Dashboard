import { useState, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '@/lib/api/auth';

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

export function useOrganizations(): UseOrganizationsReturn {
  const [organizations, setOrganizations] = useState<Record<string, Organization>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingOrgs, setFetchingOrgs] = useState<Set<string>>(new Set());

  // Fetch a single organization by ID
  const fetchOrganization = useCallback(async (orgId: string) => {
    // Skip if already cached or currently fetching
    if (organizations[orgId] || fetchingOrgs.has(orgId)) {
      return;
    }

    setFetchingOrgs(prev => new Set(prev).add(orgId));
    setError(null);

    try {
      const orgData = await authApi.getOrganization(orgId);
      setOrganizations(prev => ({
        ...prev,
        [orgId]: {
          id: orgData.id,
          name: orgData.name
        }
      }));
    } catch (err) {
      console.error(`Error fetching organization ${orgId}:`, err);
      // Don't set error for individual org failures, just log them
    } finally {
      setFetchingOrgs(prev => {
        const newSet = new Set(prev);
        newSet.delete(orgId);
        return newSet;
      });
    }
  }, [organizations, fetchingOrgs]);

  // Fetch multiple organizations
  const fetchOrganizations = useCallback(async (orgIds: string[]) => {
    const uniqueOrgIds = Array.from(new Set(orgIds));
    const orgsToFetch = uniqueOrgIds.filter(orgId => !organizations[orgId] && !fetchingOrgs.has(orgId));
    
    if (orgsToFetch.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all organizations in parallel
      const fetchPromises = orgsToFetch.map(orgId => fetchOrganization(orgId));
      await Promise.allSettled(fetchPromises);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setIsLoading(false);
    }
  }, [organizations, fetchingOrgs, fetchOrganization]);

  // Refresh all cached organizations
  const refreshOrganizations = useCallback(async () => {
    const orgIds = Object.keys(organizations);
    if (orgIds.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Clear cache and refetch
      setOrganizations({});
      const fetchPromises = orgIds.map(orgId => fetchOrganization(orgId));
      await Promise.allSettled(fetchPromises);
    } catch (err) {
      console.error('Error refreshing organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh organizations');
    } finally {
      setIsLoading(false);
    }
  }, [organizations, fetchOrganization]);

  // Get organization display name
  const getOrganizationName = useCallback((orgId: string): string => {
    const org = organizations[orgId];
    if (org) {
      return org.name;
    }
    
    // For unknown organizations, create a readable format from the ID
    const shortId = orgId.substring(0, 8);
    return `Organization ${shortId.toUpperCase()}`;
  }, [organizations]);

  // Get organization short name for compact display
  const getOrganizationShortName = useCallback((orgId: string): string => {
    const fullName = getOrganizationName(orgId);
    // If it's a mapped name, return first word + first letter of second word
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
    refreshOrganizations
  };
}
