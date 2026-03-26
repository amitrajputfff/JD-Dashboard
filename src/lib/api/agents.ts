import { apiClient } from './client';
import { Agent, CreateAgentRequest, UpdateAgentRequest } from '@/types/agent';
import { PaginatedResponse, ApiResponse, AssistantsApiResponse } from '@/types/api';
import { WidgetConfig, SaveWidgetConfigResponse, GetWidgetConfigResponse } from '@/types/widget';

export const agentsApi = {
  // Get all agents with pagination and filters
  getAgents: async (params?: {
    skip?: number;
    limit?: number;
    organization_id?: string;
    is_deleted?: boolean;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    status?: string;
    tags?: string[];
  }): Promise<AssistantsApiResponse> => {
    // Get organization ID if not provided
    let orgId = params?.organization_id;
    if (!orgId) {
      try {
        if (typeof window !== 'undefined') {
          const authStorageModule = await import('../auth-storage');
          const user = authStorageModule.authStorage.getUser();
          orgId = user?.organization_id || null;
        }
      } catch (error) {
        console.error('Failed to get organization ID:', error);
      }
    }
    
    if (!orgId) {
      console.warn('No organization mapped - returning empty agents list');
      return {
        assistants: [],
        total: 0
      };
    }

    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    searchParams.append('organization_id', String(orgId));
    if (params?.is_deleted !== undefined) searchParams.append('is_deleted', params.is_deleted.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.tags && params.tags.length > 0) {
      const sanitizedTags = params.tags
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .join(',');
      if (sanitizedTags) {
        searchParams.append('tags', sanitizedTags);
      }
    }

    // Get token from auth storage
    let token = '';
    if (typeof window !== 'undefined') {
      const authStorageModule = await import('../auth-storage');
      token = authStorageModule.authStorage.getAccessToken() || '';
    }

    const response = await fetch(`https://backend.liaplus.com/backend/api/assistants?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get agent by ID
  getAgent: async (id: string): Promise<ApiResponse<Agent>> => {
    return apiClient.get(`/agents/${id}`);
  },

  // Create new agent
  createAgent: async (data: CreateAgentRequest): Promise<ApiResponse<Agent>> => {
    return apiClient.post('/agents', data);
  },

  // Update agent
  updateAgent: async (id: string, data: UpdateAgentRequest): Promise<ApiResponse<Agent>> => {
    return apiClient.put(`/agents/${id}`, data);
  },

  // Delete agent (soft delete)
  deleteAgent: async (assistantId: string): Promise<ApiResponse<null>> => {
    // Get token from auth storage
    let token = '';
    if (typeof window !== 'undefined') {
      const authStorageModule = await import('../auth-storage');
      token = authStorageModule.authStorage.getAccessToken() || '';
    }

    const response = await fetch(`https://backend.liaplus.com/backend/api/assistants/${assistantId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Restore deleted agent
  restoreAgent: async (assistantId: string): Promise<ApiResponse<Agent>> => {
    // Get token from auth storage
    let token = '';
    if (typeof window !== 'undefined') {
      const authStorageModule = await import('../auth-storage');
      token = authStorageModule.authStorage.getAccessToken() || '';
    }

    const response = await fetch(`https://backend.liaplus.com/backend/api/assistants/${assistantId}/restore`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Clone agent
  cloneAgent: async (assistantId: string, name?: string): Promise<ApiResponse<Agent>> => {
    // Get token from auth storage
    let token = '';
    if (typeof window !== 'undefined') {
      const authStorageModule = await import('../auth-storage');
      token = authStorageModule.authStorage.getAccessToken() || '';
    }

    const response = await fetch(`https://backend.liaplus.com/backend/api/assistants/${assistantId}/clone`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: name ? JSON.stringify({ name }) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Assign phone number to agent
  assignPhoneNumber: async (id: string, phoneNumber: string): Promise<ApiResponse<Agent>> => {
    return apiClient.post(`/agents/${id}/phone-numbers`, { phoneNumber });
  },

  // Remove phone number from agent
  removePhoneNumber: async (id: string, phoneNumber: string): Promise<ApiResponse<Agent>> => {
    return apiClient.delete(`/agents/${id}/phone-numbers/${phoneNumber}`);
  },

  // Update agent status
  updateStatus: async (id: string, status: Agent['status']): Promise<ApiResponse<Agent>> => {
    return apiClient.patch(`/agents/${id}/status`, { status });
  },

  // Get agent analytics
  getAgentAnalytics: async (id: string, timeRange?: string): Promise<ApiResponse<Record<string, unknown>>> => {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    return apiClient.get(`/agents/${id}/analytics${params}`);
  },

  // Save widget configuration
  saveWidgetConfig: async (assistantId: string, config: WidgetConfig): Promise<SaveWidgetConfigResponse> => {
    // Get token from auth storage
    let token = '';
    if (typeof window !== 'undefined') {
      const authStorageModule = await import('../auth-storage');
      token = authStorageModule.authStorage.getAccessToken() || '';
    }

    const response = await fetch('/api/widget/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        assistant_id: assistantId,
        config,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get widget configuration
  getWidgetConfig: async (assistantId: string): Promise<GetWidgetConfigResponse> => {
    // Get token from auth storage
    let token = '';
    if (typeof window !== 'undefined') {
      const authStorageModule = await import('../auth-storage');
      token = authStorageModule.authStorage.getAccessToken() || '';
    }

    const response = await fetch(`/api/widget/config/${assistantId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};
