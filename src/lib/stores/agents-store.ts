import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Agent } from '@/types/agent';

interface AgentsState {
  agents: Agent[];
  selectedAgent: Agent | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: Agent['status'];
    search?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AgentsActions {
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  setSelectedAgent: (agent: Agent | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<AgentsState['filters']>) => void;
  setPagination: (pagination: Partial<AgentsState['pagination']>) => void;
  clearFilters: () => void;
  reset: () => void;
}

type AgentsStore = AgentsState & AgentsActions;

const initialState: AgentsState = {
  agents: [],
  selectedAgent: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

export const useAgentsStore = create<AgentsStore>()(
  devtools(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (set, _get) => ({
      ...initialState,

      setAgents: (agents) => 
        set({ agents }, false, 'setAgents'),

      addAgent: (agent) => 
        set(
          (state) => ({ 
            agents: [agent, ...state.agents],
            pagination: {
              ...state.pagination,
              total: state.pagination.total + 1,
            }
          }),
          false,
          'addAgent'
        ),

      updateAgent: (id, updates) =>
        set(
          (state) => ({
            agents: state.agents.map((agent) =>
              agent.id === id ? { ...agent, ...updates } : agent
            ),
            selectedAgent: state.selectedAgent?.id === id 
              ? { ...state.selectedAgent, ...updates } 
              : state.selectedAgent,
          }),
          false,
          'updateAgent'
        ),

      deleteAgent: (id) =>
        set(
          (state) => ({
            agents: state.agents.filter((agent) => agent.id !== id),
            selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent,
            pagination: {
              ...state.pagination,
              total: Math.max(0, state.pagination.total - 1),
            }
          }),
          false,
          'deleteAgent'
        ),

      setSelectedAgent: (agent) =>
        set({ selectedAgent: agent }, false, 'setSelectedAgent'),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'setLoading'),

      setError: (error) =>
        set({ error }, false, 'setError'),

      setFilters: (newFilters) =>
        set(
          (state) => ({ 
            filters: { ...state.filters, ...newFilters },
            pagination: { ...state.pagination, page: 1 } // Reset to first page
          }),
          false,
          'setFilters'
        ),

      setPagination: (newPagination) =>
        set(
          (state) => ({ 
            pagination: { ...state.pagination, ...newPagination } 
          }),
          false,
          'setPagination'
        ),

      clearFilters: () =>
        set(
          (state) => ({
            filters: {},
            pagination: { ...state.pagination, page: 1 }
          }),
          false,
          'clearFilters'
        ),

      reset: () =>
        set(initialState, false, 'reset'),
    }),
    { name: 'agents-store' }
  )
);
