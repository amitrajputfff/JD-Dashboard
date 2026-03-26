import { useCallback, useMemo } from 'react';
import { mockAgents } from '@/lib/mock-data/agents';
import { Agent } from '@/types/agent';

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
  const counts = useMemo(() => {
    const deletedCount = mockAgents.filter(a => a.is_deleted === true).length;
    const draftCount = mockAgents.filter(a => !a.is_deleted && a.status === 'Draft').length;
    const nonDeletedTotal = mockAgents.filter(a => !a.is_deleted).length;
    const normalCount = Math.max(0, nonDeletedTotal - draftCount);

    return {
      normal: initialParams.skipNormalCount ? 0 : normalCount,
      drafts: initialParams.fetchDrafts ? draftCount : 0,
      deleted: initialParams.fetchDeleted ? deletedCount : 0,
    };
  }, [initialParams.skipNormalCount, initialParams.fetchDrafts, initialParams.fetchDeleted]);

  const noop = useCallback(async () => {
    // No-op: data is computed synchronously from mock data
  }, []);

  return {
    normalAgents: {
      agents: [],
      total: counts.normal,
      loading: false,
      error: null,
    },
    draftAgents: {
      agents: [],
      total: counts.drafts,
      loading: false,
      error: null,
    },
    deletedAgents: {
      agents: [],
      total: counts.deleted,
      loading: false,
      error: null,
    },
    counts,
    refetchAll: noop,
    refetchNormal: noop,
    refetchDrafts: noop,
    refetchDeleted: noop,
  };
};
