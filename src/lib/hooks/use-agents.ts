import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsApi } from '@/lib/api/agents';
import { useAgentsStore } from '@/lib/stores/agents-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { Agent, CreateAgentRequest, UpdateAgentRequest } from '@/types/agent';
import { toast } from 'sonner';

const QUERY_KEYS = {
  agents: 'agents',
  agent: (id: string) => ['agent', id],
  agentAnalytics: (id: string) => ['agent-analytics', id],
} as const;

// Get all agents
export function useAgents() {
  const { filters, pagination } = useAgentsStore();
  const { setAgents, setLoading, setError, setPagination } = useAgentsStore();

  return useQuery({
    queryKey: [QUERY_KEYS.agents, filters, pagination.page, pagination.limit],
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await agentsApi.getAgents({
          page: pagination.page,
          limit: pagination.limit,
          status: filters.status,
          search: filters.search,
        });
        
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
      const response = await agentsApi.getAgent(id);
      setSelectedAgent(response.data);
      return response.data;
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
    mutationFn: (data: CreateAgentRequest) => agentsApi.createAgent(data),
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
    mutationFn: ({ id, data }: { id: string; data: UpdateAgentRequest }) =>
      agentsApi.updateAgent(id, data),
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
    mutationFn: (id: string) => agentsApi.deleteAgent(id),
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
    mutationFn: ({ id, status }: { id: string; status: Agent['status'] }) =>
      agentsApi.updateStatus(id, status),
    onSuccess: (response, variables) => {
      updateAgent(variables.id, { status: variables.status });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.agents] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agent(variables.id) });
      
      const statusText = variables.status === 'active' ? 'activated' : 'deactivated';
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
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      agentsApi.cloneAgent(id, name),
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
