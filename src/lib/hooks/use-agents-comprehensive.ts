import { useState, useEffect, useCallback } from 'react';
import { agentsApi } from '@/lib/api/agents';
import { Agent } from '@/types/agent';

interface UseAgentsComprehensiveParams {
  organization_id?: string;
  enabled?: boolean;
  fetchDeleted?: boolean;
  fetchDrafts?: boolean;
  skipNormalCount?: boolean;
}

interface AgentData {
  agents: Agent[];
  total: number;
  loading: boolean;
  error: string | null;
}

interface UseAgentsComprehensiveReturn {
  normalAgents: AgentData;
  draftAgents: AgentData;
  deletedAgents: AgentData;
  counts: { normal: number; drafts: number; deleted: number };
  refetchAll: () => Promise<void>;
  refetchNormal: () => Promise<void>;
  refetchDrafts: () => Promise<void>;
  refetchDeleted: () => Promise<void>;
}

const EMPTY: AgentData = { agents: [], total: 0, loading: false, error: null };

export const useAgentsComprehensive = (params: UseAgentsComprehensiveParams = {}): UseAgentsComprehensiveReturn => {
  const { organization_id, enabled = true, fetchDeleted, fetchDrafts, skipNormalCount } = params;

  const [normal, setNormal] = useState<AgentData>(EMPTY);
  const [drafts, setDrafts] = useState<AgentData>(EMPTY);
  const [deleted, setDeleted] = useState<AgentData>(EMPTY);

  const fetchNormal = useCallback(async () => {
    if (!enabled || skipNormalCount) return;
    try {
      const res = await agentsApi.getAgents({ organization_id, is_deleted: false, status: 'Active', limit: 1 });
      setNormal({ agents: [], total: res.total ?? 0, loading: false, error: null });
    } catch { /* ignore */ }
  }, [organization_id, enabled, skipNormalCount]);

  const fetchDraftsData = useCallback(async () => {
    if (!enabled || !fetchDrafts) return;
    try {
      const res = await agentsApi.getAgents({ organization_id, is_deleted: false, status: 'Draft', limit: 1 });
      setDrafts({ agents: [], total: res.total ?? 0, loading: false, error: null });
    } catch { /* ignore */ }
  }, [organization_id, enabled, fetchDrafts]);

  const fetchDeletedData = useCallback(async () => {
    if (!enabled || !fetchDeleted) return;
    try {
      const res = await agentsApi.getAgents({ organization_id, is_deleted: true, limit: 1 });
      setDeleted({ agents: [], total: res.total ?? 0, loading: false, error: null });
    } catch { /* ignore */ }
  }, [organization_id, enabled, fetchDeleted]);

  const refetchAll = useCallback(async () => {
    await Promise.all([fetchNormal(), fetchDraftsData(), fetchDeletedData()]);
  }, [fetchNormal, fetchDraftsData, fetchDeletedData]);

  useEffect(() => { fetchNormal(); }, [fetchNormal]);
  useEffect(() => { fetchDraftsData(); }, [fetchDraftsData]);
  useEffect(() => { fetchDeletedData(); }, [fetchDeletedData]);

  return {
    normalAgents: normal,
    draftAgents: drafts,
    deletedAgents: deleted,
    counts: { normal: normal.total, drafts: drafts.total, deleted: deleted.total },
    refetchAll,
    refetchNormal: fetchNormal,
    refetchDrafts: fetchDraftsData,
    refetchDeleted: fetchDeletedData,
  };
};
