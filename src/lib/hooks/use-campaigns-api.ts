import React, { useState, useEffect, useCallback } from 'react';
import { campaignsApi } from '@/lib/api/campaigns';
import { Campaign, CampaignsApiResponse } from '@/types/campaign';

interface UseCampaignsApiParams {
  skip?: number;
  limit?: number;
  organization_id?: string;
  status?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  enabled?: boolean; // Add option to disable API calls
}

interface UseCampaignsApiReturn {
  campaigns: Campaign[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateParams: (newParams: Partial<UseCampaignsApiParams>) => void;
}

export const useCampaignsApi = (initialParams: UseCampaignsApiParams = {}): UseCampaignsApiReturn => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(initialParams.enabled !== false); // Start with true if enabled
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<UseCampaignsApiParams>(initialParams);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const hasInitialized = React.useRef(false);

  // Sync params state with incoming props
  useEffect(() => {
    setParams(initialParams);
  }, [
    initialParams.organization_id,
    initialParams.enabled,
    initialParams.skip,
    initialParams.limit,
    initialParams.status,
    initialParams.search,
    initialParams.sort_by,
    initialParams.sort_order,
  ]);

  const fetchCampaigns = useCallback(async () => {
    // Don't fetch if organization_id is not available
    if (!params.organization_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response: CampaignsApiResponse = await campaignsApi.getCampaigns(params);
      setCampaigns(response.campaigns);
      setTotal(response.total);
      setIsInitialLoad(false);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  }, [
    params.skip,
    params.limit,
    params.organization_id,
    params.status,
    params.search,
    params.sort_by,
    params.sort_order,
  ]);

  const updateParams = useCallback((newParams: Partial<UseCampaignsApiParams>) => {
    // Set loading to true immediately when params change to prevent flash
    // Only set loading if we're not in the initial load phase
    setParams(prev => {
      const hasChanged = Object.keys(newParams).some(key => prev[key as keyof UseCampaignsApiParams] !== newParams[key as keyof UseCampaignsApiParams]);
      if (hasChanged && !isInitialLoad) {
        setLoading(true);
      }
      return { ...prev, ...newParams };
    });
  }, [isInitialLoad]);

  useEffect(() => {
    if (params.enabled !== false) {
      if (!hasInitialized.current) {
        hasInitialized.current = true;
      }
      fetchCampaigns();
    } else if (params.enabled === false) {
      setLoading(false);
    }
  }, [
    params.skip,
    params.limit,
    params.organization_id,
    params.status,
    params.search,
    params.sort_by,
    params.sort_order,
    params.enabled,
    fetchCampaigns
  ]);

  return {
    campaigns,
    total,
    loading,
    error,
    refetch: fetchCampaigns,
    updateParams,
  };
};

