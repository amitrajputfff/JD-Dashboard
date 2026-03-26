import React, { useState, useEffect, useCallback } from 'react';
import { agentsApi } from '@/lib/api/agents';
import { Agent } from '@/types/agent';
import { AssistantsApiResponse } from '@/types/api';

interface UseAgentsApiParams {
  skip?: number;
  limit?: number;
  organization_id?: string;
  is_deleted?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  status?: string;
  tags?: string[];
  enabled?: boolean; // Add option to disable API calls
}

interface UseAgentsApiReturn {
  agents: Agent[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateParams: (newParams: Partial<UseAgentsApiParams>) => void;
}

export const useAgentsApi = (initialParams: UseAgentsApiParams = {}): UseAgentsApiReturn => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(initialParams.enabled !== false); // Start with true if enabled
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<UseAgentsApiParams>(initialParams);
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
    initialParams.is_deleted,
    initialParams.search,
    initialParams.sort_by,
    initialParams.sort_order,
    initialParams.status,
    initialParams.tags,
  ]);

  const fetchAgents = useCallback(async () => {
    // Don't fetch if organization_id is not available
    if (!params.organization_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response: AssistantsApiResponse = await agentsApi.getAgents(params);
      setAgents(response.assistants);
      setTotal(response.total);
      setIsInitialLoad(false);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  }, [
    params.skip,
    params.limit,
    params.organization_id,
    params.is_deleted,
    params.search,
    params.sort_by,
    params.sort_order,
    params.status,
    params.tags
  ]);

  const updateParams = useCallback((newParams: Partial<UseAgentsApiParams>) => {
    // Set loading to true immediately when params change to prevent flash
    // Only set loading if we're not in the initial load phase
    setParams(prev => {
      const hasChanged = Object.keys(newParams).some(key => prev[key as keyof UseAgentsApiParams] !== newParams[key as keyof UseAgentsApiParams]);
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
      fetchAgents();
    } else if (params.enabled === false) {
      setLoading(false);
    }
  }, [
    params.skip,
    params.limit,
    params.organization_id,
    params.is_deleted,
    params.search,
    params.sort_by,
    params.sort_order,
    params.status,
    params.tags,
    params.enabled,
    fetchAgents
  ]);

  return {
    agents,
    total,
    loading,
    error,
    refetch: fetchAgents,
    updateParams,
  };
};
