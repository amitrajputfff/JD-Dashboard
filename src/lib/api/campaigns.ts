import { apiClient } from './client';
import type { Campaign, CreateCampaignRequest, CampaignListResponse, UploadContactsResponse, CampaignDetailsApiResponse } from '@/types/campaign';

// Re-export types for convenience
export type { Campaign, CreateCampaignRequest, CampaignListResponse, UploadContactsResponse, CampaignDetailsApiResponse } from '@/types/campaign';

export const campaignsApi = {
  /**
   * Get all campaigns with pagination and filters
   */
  async getCampaigns(params?: {
    skip?: number;
    limit?: number;
    organization_id?: string;
    status?: string;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<CampaignListResponse> {
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
      orgId = 'default-org';
    }

    const searchParams = new URLSearchParams();
    
    if (params?.skip !== undefined) {
      searchParams.append('skip', params.skip.toString());
    }
    if (params?.limit !== undefined) {
      searchParams.append('limit', params.limit.toString());
    }
    searchParams.append('organization_id', String(orgId));
    if (params?.status) {
      searchParams.append('status', params.status);
    }
    if (params?.search) {
      searchParams.append('search', params.search);
    }
    if (params?.sort_by) {
      searchParams.append('sort_by', params.sort_by);
    }
    if (params?.sort_order) {
      searchParams.append('sort_order', params.sort_order);
    }

    // Get token from auth storage
    let token = '';
    if (typeof window !== 'undefined') {
      const authStorageModule = await import('../auth-storage');
      token = authStorageModule.authStorage.getAccessToken() || '';
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/campaigns?${searchParams.toString()}`, {
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

  /**
   * Get campaign by ID with contact pagination
   */
  async getCampaign(id: string, params?: {
    contact_skip?: number;
    contact_limit?: number;
  }): Promise<CampaignDetailsApiResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.contact_skip !== undefined) {
      searchParams.append('contact_skip', params.contact_skip.toString());
    }
    if (params?.contact_limit !== undefined) {
      searchParams.append('contact_limit', params.contact_limit.toString());
    }

    // Get token from auth storage
    let token = '';
    if (typeof window !== 'undefined') {
      const authStorageModule = await import('../auth-storage');
      token = authStorageModule.authStorage.getAccessToken() || '';
    }

    const queryString = searchParams.toString();
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/campaigns/${id}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
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

  /**
   * Create a new campaign
   */
  async createCampaign(data: CreateCampaignRequest): Promise<Campaign> {
    const response = await apiClient.post('/api/campaigns', data);
    return response as unknown as Campaign;
  },

  /**
   * Update campaign
   */
  async updateCampaign(id: string, data: {
    name?: string;
    description?: string;
    status?: string;
    max_retries?: number;
    retry_delay_minutes?: number;
    call_timeout_seconds?: number;
    schedule_campaign?: boolean;
    schedule_time?: string;
    consent_required?: boolean;
  }): Promise<{
    campaign_id: string;
    status: string;
    message: string;
  }> {
    // Get token from auth storage
    let token = '';
    if (typeof window !== 'undefined') {
      const authStorageModule = await import('../auth-storage');
      token = authStorageModule.authStorage.getAccessToken() || '';
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/campaigns/${id}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Delete campaign
   */
  async deleteCampaign(id: string): Promise<{ success: boolean }> {
    await apiClient.delete(`/api/campaigns/${id}`);
    return { success: true };
  },

  /**
   * Start campaign
   */
  async startCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.post(`/api/campaigns/${id}/start`, {});
    return response as unknown as Campaign;
  },

  /**
   * Pause campaign
   */
  async pauseCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.post(`/api/campaigns/${id}/pause`, {});
    return response as unknown as Campaign;
  },

  /**
   * Resume campaign
   */
  async resumeCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.post(`/api/campaigns/${id}/resume`, {});
    return response as unknown as Campaign;
  },

  /**
   * Upload contacts to campaign (CSV only)
   */
  async uploadContacts(id: string, file: File): Promise<UploadContactsResponse> {
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      throw new Error('Only CSV files are allowed');
    }

    const formData = new FormData();
    formData.append('file', file);

    // Get token from auth storage
    let token = '';
    if (typeof window !== 'undefined') {
      const authStorageModule = await import('../auth-storage');
      token = authStorageModule.authStorage.getAccessToken() || '';
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/campaigns/${id}/upload-contacts`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Start a scheduled campaign
   */
  async startCampaign(campaignId: string): Promise<{ 
    status: string; 
    message: string; 
    total_calls_initiated: number; 
    failed_calls: number; 
  }> {
    // Get token from auth storage
    let token = '';
    if (typeof window !== 'undefined') {
      const authStorageModule = await import('../auth-storage');
      token = authStorageModule.authStorage.getAccessToken() || '';
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/campaigns/${campaignId}/start`, {
      method: 'POST',
      headers: {
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

  /**
   * Make an outbound call
   */
  async makeCall(data: {
    phone_num: string;
    callerid: string;
  }): Promise<{ 
    status: string; 
    message: string; 
    call_id?: string;
  }> {
    // Get token from auth storage
    let token = '';
    if (typeof window !== 'undefined') {
      const authStorageModule = await import('../auth-storage');
      token = authStorageModule.authStorage.getAccessToken() || '';
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/campaigns/make-call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

