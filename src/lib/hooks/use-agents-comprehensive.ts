import { useState, useEffect, useCallback } from 'react';
import { agentsApi } from '@/lib/api/agents';
import { Agent } from '@/types/agent';
import { AssistantsApiResponse } from '@/types/api';

interface UseAgentsComprehensiveParams {
  organization_id?: string;
  enabled?: boolean;
  fetchDeleted?: boolean; // Only fetch deleted counts when needed
  fetchDrafts?: boolean;  // Only fetch draft counts when needed
  skipNormalCount?: boolean; // Skip normal count if main hook is already fetching it
}

interface AgentData {
  agents: Agent[];
  total: number;
  loading: boolean;
  error: string | null;
}

interface UseAgentsComprehensiveReturn {
  // Normal agents (not drafts, not deleted)
  normalAgents: AgentData;
  // Draft agents
  draftAgents: AgentData;
  // Deleted agents  
  deletedAgents: AgentData;
  // Counts for display
  counts: {
    normal: number;
    drafts: number;
    deleted: number;
  };
  // Control functions
  refetchAll: () => Promise<void>;
  refetchNormal: () => Promise<void>;
  refetchDrafts: () => Promise<void>;
  refetchDeleted: () => Promise<void>;
}

export const useAgentsComprehensive = (initialParams: UseAgentsComprehensiveParams = {}): UseAgentsComprehensiveReturn => {
  const [params, setParams] = useState<UseAgentsComprehensiveParams>(initialParams);
  
  // Combined state for all counts
  const [counts, setCounts] = useState({
    normal: 0,
    drafts: 0,
    deleted: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Sync params state with incoming props
  useEffect(() => {
    setParams(initialParams);
  }, [initialParams.organization_id, initialParams.enabled, initialParams.fetchDeleted, initialParams.fetchDrafts, initialParams.skipNormalCount]);

  // Optimized fetch function that only fetches what's needed
  const fetchAllCounts = useCallback(async () => {
    if (!params.organization_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const apiCalls = [];
      
      // Only fetch non-deleted agents count if we're not already fetching it in the main hook
      // This avoids duplication when the main hook is fetching the same data
      if (!params.skipNormalCount) {
        apiCalls.push(
          agentsApi.getAgents({
            organization_id: params.organization_id,
            is_deleted: false,
            status: undefined, // This gets all non-deleted agents
            skip: 0,
            limit: 1,
          })
        );
      }
      
      // Only fetch deleted agents if requested
      if (params.fetchDeleted) {
        apiCalls.push(
          agentsApi.getAgents({
            organization_id: params.organization_id,
            is_deleted: true,
            status: undefined,
            skip: 0,
            limit: 1,
          })
        );
      }
      
      // Only fetch draft agents if requested
      if (params.fetchDrafts) {
        apiCalls.push(
          agentsApi.getAgents({
            organization_id: params.organization_id,
            is_deleted: false,
            status: 'Draft',
            skip: 0,
            limit: 1,
          })
        );
      }

      const responses = await Promise.all(apiCalls);
      let responseIndex = 0;
      const nonDeletedResponse = params.skipNormalCount ? null : responses[responseIndex++];
      const deletedResponse = params.fetchDeleted ? responses[responseIndex++] : null;
      const draftResponse = params.fetchDrafts ? responses[responseIndex++] : null;

      const newCounts = {
        normal: nonDeletedResponse ? (nonDeletedResponse.total - (draftResponse?.total || 0)) : 0,
        drafts: draftResponse?.total || 0,
        deleted: deletedResponse?.total || 0,
      };

      setCounts(newCounts);
      setHasFetched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents counts');
      console.error('Error fetching agents counts:', err);
    } finally {
      setLoading(false);
    }
  }, [params.organization_id, params.fetchDeleted, params.fetchDrafts]);

  // Individual fetch functions for specific updates
  const fetchNormalAgents = useCallback(async () => {
    if (!params.organization_id) return;
    
    try {
      const [nonDeletedResponse, draftResponse] = await Promise.all([
        agentsApi.getAgents({
          organization_id: params.organization_id,
          is_deleted: false,
          status: undefined,
          skip: 0,
          limit: 1,
        }),
        agentsApi.getAgents({
          organization_id: params.organization_id,
          is_deleted: false,
          status: 'Draft',
          skip: 0,
          limit: 1,
        })
      ]);

      setCounts(prev => ({
        ...prev,
        normal: Math.max(0, nonDeletedResponse.total - draftResponse.total),
      }));
    } catch (err) {
      console.error('Error fetching normal agents count:', err);
    }
  }, [params.organization_id]);

  const fetchDraftAgents = useCallback(async () => {
    if (!params.organization_id) return;
    
    try {
      const response = await agentsApi.getAgents({
        organization_id: params.organization_id,
        is_deleted: false,
        status: 'Draft',
        skip: 0,
        limit: 1,
      });

      setCounts(prev => ({
        ...prev,
        drafts: response.total,
      }));
    } catch (err) {
      console.error('Error fetching draft agents count:', err);
    }
  }, [params.organization_id]);

  const fetchDeletedAgents = useCallback(async () => {
    if (!params.organization_id) return;
    
    try {
      const response = await agentsApi.getAgents({
        organization_id: params.organization_id,
        is_deleted: true,
        status: undefined,
        skip: 0,
        limit: 1,
      });

      setCounts(prev => ({
        ...prev,
        deleted: response.total,
      }));
    } catch (err) {
      console.error('Error fetching deleted agents count:', err);
    }
  }, [params.organization_id]);

  const refetchAll = useCallback(async () => {
    await fetchAllCounts();
  }, [fetchAllCounts]);

  // Only fetch on mount or when organization_id changes
  useEffect(() => {
    if (params.enabled !== false && params.organization_id && !hasFetched) {
      fetchAllCounts();
    }
  }, [params.enabled, params.organization_id, hasFetched, fetchAllCounts]);

  return {
    normalAgents: {
      agents: [],
      total: counts.normal,
      loading,
      error,
    },
    draftAgents: {
      agents: [],
      total: counts.drafts,
      loading,
      error,
    },
    deletedAgents: {
      agents: [],
      total: counts.deleted,
      loading,
      error,
    },
    counts,
    refetchAll,
    refetchNormal: fetchNormalAgents,
    refetchDrafts: fetchDraftAgents,
    refetchDeleted: fetchDeletedAgents,
  };
};
