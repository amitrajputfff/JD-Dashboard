import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { mockPhoneNumbers } from '@/lib/mock-data/phone-numbers';
import {
  CreatePhoneNumberRequest,
  PhoneNumber,
  PhoneNumberDetail,
  UpdatePhoneNumberRequest,
} from '@/types/phone-number';

interface UsePhoneNumbersOptions {
  organizationId?: string;
  skip?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  provider_id?: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

export const usePhoneNumbers = (options: UsePhoneNumbersOptions = {}) => {
  const [currentOptions, setCurrentOptions] = useState<UsePhoneNumbersOptions>(options);
  const [currentNumber, setCurrentNumber] = useState<PhoneNumberDetail | null>(null);
  const [localNumbers, setLocalNumbers] = useState<PhoneNumber[]>(mockPhoneNumbers);

  const { phoneNumbers, pagination } = useMemo(() => {
    let filtered = [...localNumbers];

    // Filter by is_active
    if (currentOptions.is_active !== undefined) {
      filtered = filtered.filter(p => p.is_active === currentOptions.is_active);
    }

    // Filter by provider_id
    if (currentOptions.provider_id !== undefined) {
      const pid = Number(currentOptions.provider_id);
      filtered = filtered.filter(p => p.provider_id === pid);
    }

    // Filter by search
    if (currentOptions.search) {
      const term = currentOptions.search.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.phone_number?.toLowerCase().includes(term) ||
          p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }

    const total = filtered.length;
    const skip = currentOptions.skip ?? 0;
    const limit = currentOptions.limit ?? 10;
    const page = Math.floor(skip / limit) + 1;
    const paginated = filtered.slice(skip, skip + limit);

    return {
      phoneNumbers: paginated,
      pagination: { page, limit, total } as PaginationState,
    };
  }, [
    localNumbers,
    currentOptions.is_active,
    currentOptions.provider_id,
    currentOptions.search,
    currentOptions.skip,
    currentOptions.limit,
  ]);

  const fetchPhoneNumbers = useCallback(
    async (_params?: {
      skip?: number;
      limit?: number;
      organization_id?: string;
      search?: string;
      is_active?: boolean;
      provider_id?: string;
    }) => {
      // No-op: data is computed synchronously from mock data
      return phoneNumbers;
    },
    [phoneNumbers]
  );

  const createPhoneNumber = useCallback(
    async (payload: CreatePhoneNumberRequest) => {
      const newNumber: PhoneNumber = {
        id: localNumbers.length + 1,
        organization_id: payload.organization_id,
        name: payload.name ?? null,
        provider_id: payload.provider_id,
        phone_number: payload.phone_number,
        type: payload.type ?? null,
        description: payload.description ?? null,
        is_active: payload.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        mapped_assistant: null,
      };
      setLocalNumbers(prev => [...prev, newNumber]);
      toast.success('Phone number created successfully');
      return newNumber;
    },
    [localNumbers.length]
  );

  const updatePhoneNumber = useCallback(
    async (id: number, payload: UpdatePhoneNumberRequest) => {
      let updated: PhoneNumber | undefined;
      setLocalNumbers(prev =>
        prev.map(p => {
          if (p.id === id) {
            updated = { ...p, ...payload, updated_at: new Date().toISOString() };
            return updated;
          }
          return p;
        })
      );
      toast.success('Phone number updated successfully');
      return updated!;
    },
    []
  );

  const assignAssistant = useCallback(
    async (phoneId: number, assistantId: string) => {
      let result: PhoneNumberDetail | undefined;
      setLocalNumbers(prev =>
        prev.map(p => {
          if (p.id === phoneId) {
            const updated = {
              ...p,
              mapped_assistant: {
                id: 0,
                assistant_id: assistantId,
                name: assistantId,
                status: 'Active',
                is_active: true,
              },
              updated_at: new Date().toISOString(),
            };
            result = { ...updated, provider: null };
            return updated;
          }
          return p;
        })
      );
      if (result) setCurrentNumber(result);
      toast.success('Assistant assigned to phone number');
      return result!;
    },
    []
  );

  const unassignAssistant = useCallback(
    async (phoneId: number, _assistantId: string) => {
      let result: PhoneNumberDetail | undefined;
      setLocalNumbers(prev =>
        prev.map(p => {
          if (p.id === phoneId) {
            const updated = {
              ...p,
              mapped_assistant: null,
              updated_at: new Date().toISOString(),
            };
            result = { ...updated, provider: null };
            return updated;
          }
          return p;
        })
      );
      if (result) setCurrentNumber(result);
      toast.success('Assistant unassigned from phone number');
      return result!;
    },
    []
  );

  const deletePhoneNumber = useCallback(async (id: number) => {
    setLocalNumbers(prev => prev.filter(p => p.id !== id));
    toast.success('Phone number deleted successfully');
  }, []);

  const fetchPhoneNumber = useCallback(async (id: number) => {
    const found = localNumbers.find(p => p.id === id);
    if (!found) {
      const message = 'Phone number not found';
      toast.error(message);
      throw new Error(message);
    }
    const detail: PhoneNumberDetail = { ...found, provider: null };
    setCurrentNumber(detail);
    return detail;
  }, [localNumbers]);

  const updateParams = useCallback((newOptions: Partial<UsePhoneNumbersOptions>) => {
    setCurrentOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  return {
    phoneNumbers,
    pagination,
    loading: false,
    error: null,
    detailLoading: false,
    currentNumber,
    fetchPhoneNumbers,
    createPhoneNumber,
    updatePhoneNumber,
    assignAssistant,
    unassignAssistant,
    deletePhoneNumber,
    fetchPhoneNumber,
    updateParams,
  };
};
