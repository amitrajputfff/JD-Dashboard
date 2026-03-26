import { useState, useCallback, useMemo } from 'react';
import { mockAgents } from '@/lib/mock-data/agents';
import { Agent } from '@/types/agent';

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
  const [params, setParams] = useState<UseAgentsApiParams>(initialParams);

  const { agents, total } = useMemo(() => {
    if (params.enabled === false) {
      return { agents: [], total: 0 };
    }

    let filtered = [...mockAgents];

    // Filter by is_deleted
    if (params.is_deleted !== undefined) {
      filtered = filtered.filter(a => a.is_deleted === params.is_deleted);
    }

    // Filter by status
    if (params.status) {
      filtered = filtered.filter(a => a.status === params.status);
    }

    // Filter by search
    if (params.search) {
      const term = params.search.toLowerCase();
      filtered = filtered.filter(
        a =>
          a.name.toLowerCase().includes(term) ||
          a.description?.toLowerCase().includes(term) ||
          a.category?.toLowerCase().includes(term)
      );
    }

    // Filter by tags
    if (params.tags && params.tags.length > 0) {
      filtered = filtered.filter(a =>
        params.tags!.some(tag => a.tags?.includes(tag))
      );
    }

    // Sort
    if (params.sort_by) {
      const key = params.sort_by as keyof Agent;
      const order = params.sort_order === 'desc' ? -1 : 1;
      filtered = filtered.slice().sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (av < bv) return -1 * order;
        if (av > bv) return 1 * order;
        return 0;
      });
    }

    const total = filtered.length;

    // Pagination
    const skip = params.skip ?? 0;
    const limit = params.limit ?? filtered.length;
    const agents = filtered.slice(skip, skip + limit);

    return { agents, total };
  }, [
    params.enabled,
    params.is_deleted,
    params.status,
    params.search,
    params.tags,
    params.sort_by,
    params.sort_order,
    params.skip,
    params.limit,
  ]);

  const refetch = useCallback(async () => {
    // No-op: data is computed synchronously from mock data
  }, []);

  const updateParams = useCallback((newParams: Partial<UseAgentsApiParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  return {
    agents,
    total,
    loading: false,
    error: null,
    refetch,
    updateParams,
  };
};
