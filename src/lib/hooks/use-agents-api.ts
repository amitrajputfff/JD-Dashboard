import { useState, useEffect, useCallback, useRef } from 'react';
import { agentsApi } from '@/lib/api/agents';
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
  enabled?: boolean;
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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchAgents = useCallback(async (p: UseAgentsApiParams) => {
    if (p.enabled === false) {
      setAgents([]);
      setTotal(0);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const result = await agentsApi.getAgents({
        skip: p.skip,
        limit: p.limit,
        organization_id: p.organization_id,
        is_deleted: p.is_deleted,
        search: p.search,
        sort_by: p.sort_by,
        sort_order: p.sort_order,
        status: p.status,
        tags: p.tags,
      });
      setAgents((result.assistants as unknown as Agent[]) ?? []);
      setTotal(result.total ?? 0);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message ?? 'Failed to load agents');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents(params);
  }, [
    params.enabled,
    params.organization_id,
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
    await fetchAgents(params);
  }, [fetchAgents, params]);

  const updateParams = useCallback((newParams: Partial<UseAgentsApiParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  return { agents, total, loading, error, refetch, updateParams };
};
