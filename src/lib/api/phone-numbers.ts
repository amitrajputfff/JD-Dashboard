import { apiClient } from './client';
import { authStorage } from '@/lib/auth-storage';
import {
  CreatePhoneNumberRequest,
  PhoneNumber,
  PhoneNumberDetail,
  PhoneNumberListResponse,
  UpdatePhoneNumberRequest,
} from '@/types/phone-number';

const cleanPayload = <T extends Record<string, unknown>>(payload: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
};

const resolveOrganizationId = (organizationId?: string): string => {
  if (organizationId) {
    return organizationId;
  }

  if (typeof window !== 'undefined') {
    const user = authStorage.getUser();
    if (user?.organization_id) {
      return user.organization_id;
    }
  }

  return 'default-org';
};

export const phoneNumbersApi = {
  async list(params?: {
    organization_id?: string;
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
    provider_id?: string;
  }): Promise<PhoneNumberListResponse> {
    const searchParams = new URLSearchParams();
    const organizationId = resolveOrganizationId(params?.organization_id);

    searchParams.append('organization_id', organizationId);
    if (typeof params?.skip === 'number') {
      searchParams.append('skip', params.skip.toString());
    }
    if (typeof params?.limit === 'number') {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.search) {
      searchParams.append('search', params.search);
    }
    if (typeof params?.is_active === 'boolean') {
      searchParams.append('is_active', params.is_active.toString());
    }
    if (params?.provider_id && params.provider_id !== 'all') {
      searchParams.append('provider_id', params.provider_id);
    }

    const response = await apiClient.get(
      `/api/phone-numbers?${searchParams.toString()}`
    );

    return response as unknown as PhoneNumberListResponse;
  },

  async create(data: CreatePhoneNumberRequest): Promise<PhoneNumber> {
    const payload = cleanPayload(data);
    const response = await apiClient.post('/api/phone-numbers', payload);
    return response as unknown as PhoneNumber;
  },

  async update(id: number, data: UpdatePhoneNumberRequest): Promise<PhoneNumber> {
    const payload = cleanPayload(data);
    const response = await apiClient.put(`/api/phone-numbers/${id}`, payload);
    return response as unknown as PhoneNumber;
  },

  async assignAssistant(phoneId: number, assistantId: string): Promise<PhoneNumberDetail> {
    const response = await apiClient.post(
      `/api/assistants/${assistantId}/phone-numbers/${phoneId}`,
      {}
    );
    return response as unknown as PhoneNumberDetail;
  },

  async unassignAssistant(phoneId: number, assistantId: string): Promise<PhoneNumberDetail> {
    const response = await apiClient.delete(
      `/api/assistants/${assistantId}/phone-numbers/${phoneId}`
    );
    return response as unknown as PhoneNumberDetail;
  },

  async remove(id: number): Promise<{ success: boolean }> {
    await apiClient.delete(`/api/phone-numbers/${id}`);
    return { success: true };
  },

  async retrieve(id: number): Promise<PhoneNumberDetail> {
    const response = await apiClient.get(`/api/phone-numbers/${id}`);
    return response as unknown as PhoneNumberDetail;
  },
};
