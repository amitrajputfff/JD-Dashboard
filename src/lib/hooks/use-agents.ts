import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgentsStore } from '@/lib/stores/agents-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { Agent, CreateAgentRequest, UpdateAgentRequest } from '@/types/agent';
import { mockAgents } from '@/lib/mock-data/agents';
import { toast } from 'sonner';

const QUERY_KEYS = {
  agents: 'agents',
  agent: (id: string) => ['agent', id],
  agentAnalytics: (id: string) => ['agent-analytics', id],
} as const;

// In-memory mutable store for mutations during the session
let sessionAgents: Agent[] = [...mockAgents];

// Get all agents
export function useAgents() {
  const { filters, pagination } = useAgentsStore();
  const { setAgents, setLoading, setError, setPagination } = useAgentsStore();

  return useQuery({
    queryKey: [QUERY_KEYS.agents, filters, pagination.page, pagination.limit],
    queryFn: async () => {
      setLoading(true);
      try {
        let filtered = sessionAgents.filter(a => !a.is_deleted);

        if (filters.status) {
          filtered = filtered.filter(a => a.status === filters.status);
        }
        if (filters.search) {
          const term = filters.search.toLowerCase();
          filtered = filtered.filter(
            a =>
              a.name.toLowerCase().includes(term) ||
              a.description?.toLowerCase().includes(term)
          );
        }

        const total = filtered.length;
        const limit = pagination.limit ?? 10;
        const page = pagination.page ?? 1;
        const skip = (page - 1) * limit;
        const data = filtered.slice(skip, skip + limit);

        const response = {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };

        setAgents(response.data);
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
        });
        setError(null);

        return response;
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'An error occurred');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    enabled: true,
  });
}

// Get single agent
export function useAgent(id: string) {
  const { setSelectedAgent } = useAgentsStore();

  return useQuery({
    queryKey: QUERY_KEYS.agent(id),
    queryFn: async () => {
      const agent = sessionAgents.find(
        a => a.assistant_id === id || String(a.id) === id
      );
      if (!agent) throw new Error('Agent not found');
      setSelectedAgent(agent);
      return agent;
    },
    enabled: !!id,
  });
}

// Create agent mutation
export function useCreateAgent() {
  const queryClient = useQueryClient();
  const { addAgent } = useAgentsStore();
  const { addNotification, closeModal } = useUIStore();

  return useMutation({
    mutationFn: async (data: CreateAgentRequest) => {
      const newAgent: Agent = {
        id: sessionAgents.length + 1,
        assistant_id: `asst-new-${Date.now()}`,
        organization_id: 'org-demo-123',
        name: data.name,
        description: data.description ?? '',
        status: 'Draft',
        category: '',
        tags: [],
        language_id: 11,
        stt_model_id: null,
        tts_model_id: null,
        llm_model_id: null,
        voice_id: null,
        prompt: null,
        speech_speed: '1.0',
        pitch: 'medium',
        interruption_level: 'low',
        cutoff_seconds: 3,
        ideal_time_seconds: 120,
        call_end_text: null,
        max_token: 1024,
        temperature: '0.7',
        memory_enabled: false,
        max_memory_retrieval: 5,
        initial_message: '',
        call_recording: false,
        barge_in: false,
        voice_activity_detection: false,
        noise_suppression: false,
        function_calling: false,
        functions: [],
        max_call_duration: 600,
        silence_timeout: 10,
        is_transferable: false,
        transfer_number: null,
        filler_message: [],
        function_filler_message: [],
        training_status: 'pending',
        logo_file_url: null,
        logo_file_type: null,
        logo_file_size: null,
        is_active: false,
        is_deleted: false,
        deleted_until: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        calls_today: 0,
        avg_duration: '0:00',
        last_active: null,
      };
      sessionAgents = [...sessionAgents, newAgent];
      return { data: newAgent };
    },
    onSuccess: (response) => {
      addAgent(response.data);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.agents] });

      addNotification({
        type: 'success',
        title: 'Agent Created',
        message: `Agent "${response.data.name}" has been created successfully.`,
      });

      closeModal('createAgent');
      toast.success(`Agent "${response.data.name}" created successfully!`);
    },
    onError: (error: unknown) => {
      addNotification({
        type: 'error',
        title: 'Failed to Create Agent',
        message: (error instanceof Error ? error.message : null) || 'An error occurred while creating the agent.',
      });

      toast.error('Failed to create agent. Please try again.');
    },
  });
}

// Update agent mutation
export function useUpdateAgent() {
  const queryClient = useQueryClient();
  const { updateAgent } = useAgentsStore();
  const { addNotification, closeModal } = useUIStore();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAgentRequest }) => {
      const idx = sessionAgents.findIndex(
        a => a.assistant_id === id || String(a.id) === id
      );
      if (idx === -1) throw new Error('Agent not found');
      const updated = {
        ...sessionAgents[idx],
        ...data,
        updated_at: new Date().toISOString(),
      } as Agent;
      sessionAgents = [
        ...sessionAgents.slice(0, idx),
        updated,
        ...sessionAgents.slice(idx + 1),
      ];
      return { data: updated };
    },
    onSuccess: (response, variables) => {
      updateAgent(variables.id, response.data);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.agents] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agent(variables.id) });

      addNotification({
        type: 'success',
        title: 'Agent Updated',
        message: `Agent "${response.data.name}" has been updated successfully.`,
      });

      closeModal('editAgent');
      toast.success(`Agent "${response.data.name}" updated successfully!`);
    },
    onError: (error: unknown) => {
      addNotification({
        type: 'error',
        title: 'Failed to Update Agent',
        message: (error instanceof Error ? error.message : null) || 'An error occurred while updating the agent.',
      });

      toast.error('Failed to update agent. Please try again.');
    },
  });
}

// Delete agent mutation
export function useDeleteAgent() {
  const queryClient = useQueryClient();
  const { deleteAgent } = useAgentsStore();
  const { addNotification, closeModal } = useUIStore();

  return useMutation({
    mutationFn: async (id: string) => {
      sessionAgents = sessionAgents.filter(
        a => a.assistant_id !== id && String(a.id) !== id
      );
    },
    onSuccess: (_, agentId) => {
      deleteAgent(agentId);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.agents] });

      addNotification({
        type: 'success',
        title: 'Agent Deleted',
        message: 'Agent has been deleted successfully.',
      });

      closeModal('deleteAgent');
      toast.success('Agent deleted successfully!');
    },
    onError: (error: unknown) => {
      addNotification({
        type: 'error',
        title: 'Failed to Delete Agent',
        message: (error instanceof Error ? error.message : null) || 'An error occurred while deleting the agent.',
      });

      toast.error('Failed to delete agent. Please try again.');
    },
  });
}

// Update agent status mutation
export function useUpdateAgentStatus() {
  const queryClient = useQueryClient();
  const { updateAgent } = useAgentsStore();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Agent['status'] }) => {
      const idx = sessionAgents.findIndex(
        a => a.assistant_id === id || String(a.id) === id
      );
      if (idx !== -1) {
        const updated = {
          ...sessionAgents[idx],
          status,
          updated_at: new Date().toISOString(),
        };
        sessionAgents = [
          ...sessionAgents.slice(0, idx),
          updated,
          ...sessionAgents.slice(idx + 1),
        ];
      }
    },
    onSuccess: (_, variables) => {
      updateAgent(variables.id, { status: variables.status });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.agents] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agent(variables.id) });

      const statusText = variables.status === 'Active' ? 'activated' : 'deactivated';
      addNotification({
        type: 'success',
        title: 'Agent Status Updated',
        message: `Agent has been ${statusText} successfully.`,
      });

      toast.success(`Agent ${statusText} successfully!`);
    },
    onError: (error: unknown) => {
      addNotification({
        type: 'error',
        title: 'Failed to Update Status',
        message: (error instanceof Error ? error.message : null) || 'An error occurred while updating the agent status.',
      });

      toast.error('Failed to update agent status. Please try again.');
    },
  });
}

// Clone agent mutation
export function useCloneAgent() {
  const queryClient = useQueryClient();
  const { addAgent } = useAgentsStore();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const source = sessionAgents.find(
        a => a.assistant_id === id || String(a.id) === id
      );
      if (!source) throw new Error('Agent not found');
      const cloned: Agent = {
        ...source,
        id: sessionAgents.length + 1,
        assistant_id: `asst-clone-${Date.now()}`,
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        calls_today: 0,
        avg_duration: '0:00',
        last_active: null,
      };
      sessionAgents = [...sessionAgents, cloned];
      return { data: cloned };
    },
    onSuccess: (response) => {
      addAgent(response.data);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.agents] });

      addNotification({
        type: 'success',
        title: 'Agent Cloned',
        message: `Agent "${response.data.name}" has been cloned successfully.`,
      });

      toast.success(`Agent "${response.data.name}" cloned successfully!`);
    },
    onError: (error: unknown) => {
      addNotification({
        type: 'error',
        title: 'Failed to Clone Agent',
        message: (error instanceof Error ? error.message : null) || 'An error occurred while cloning the agent.',
      });

      toast.error('Failed to clone agent. Please try again.');
    },
  });
}
