import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { phoneNumbersApi } from '@/lib/api/phone-numbers';
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
  
  const initialPagination: PaginationState = useMemo(
    () => ({
      page: Math.floor((currentOptions.skip ?? 0) / (currentOptions.limit ?? 10)) + 1,
      limit: currentOptions.limit ?? 10,
      total: 0,
    }),
    [currentOptions.limit, currentOptions.skip]
  );

  const paginationRef = useRef<PaginationState>(initialPagination);
  const [pagination, setPagination] = useState<PaginationState>(initialPagination);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentNumber, setCurrentNumber] = useState<PhoneNumberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPhoneNumbers = useCallback(
    async (params?: { 
      skip?: number; 
      limit?: number; 
      organization_id?: string;
      search?: string;
      is_active?: boolean;
      provider_id?: string;
    }) => {
      setLoading(true);
      setError(null);

      const requestSkip = params?.skip ?? currentOptions.skip ?? 0;
      const requestLimit = params?.limit ?? currentOptions.limit ?? 10;

      try {
        const response = await phoneNumbersApi.list({
          organization_id: params?.organization_id ?? currentOptions.organizationId,
          skip: requestSkip,
          limit: requestLimit,
          search: params?.search ?? currentOptions.search,
          is_active: params?.is_active ?? currentOptions.is_active,
          provider_id: params?.provider_id ?? currentOptions.provider_id,
        });

        // Calculate current page from skip and limit
        const currentPage = Math.floor(requestSkip / requestLimit) + 1;

        paginationRef.current = {
          page: currentPage,
          limit: requestLimit,
          total: response.total,
        };

        setPagination(paginationRef.current);
        setPhoneNumbers(response.phone_numbers);
        return response.phone_numbers;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load phone numbers';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentOptions.organizationId, currentOptions.search, currentOptions.is_active, currentOptions.provider_id, currentOptions.skip, currentOptions.limit]
  );

  const createPhoneNumber = useCallback(
    async (payload: CreatePhoneNumberRequest) => {
      try {
        const result = await phoneNumbersApi.create(payload);
        toast.success('Phone number created successfully');
        await fetchPhoneNumbers();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create phone number';
        toast.error(message);
        throw err;
      }
    },
    [fetchPhoneNumbers]
  );

  const updatePhoneNumber = useCallback(
    async (id: number, payload: UpdatePhoneNumberRequest) => {
      try {
        const result = await phoneNumbersApi.update(id, payload);
        toast.success('Phone number updated successfully');
        await fetchPhoneNumbers();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update phone number';
        toast.error(message);
        throw err;
      }
    },
    [fetchPhoneNumbers]
  );

  const assignAssistant = useCallback(
    async (phoneId: number, assistantId: string) => {
      try {
        const result = await phoneNumbersApi.assignAssistant(phoneId, assistantId);
        toast.success('Assistant assigned to phone number');
        setCurrentNumber(result);
        await fetchPhoneNumbers();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to assign assistant';
        toast.error(message);
        throw err;
      }
    },
    [fetchPhoneNumbers]
  );

  const unassignAssistant = useCallback(
    async (phoneId: number, assistantId: string) => {
      try {
        const result = await phoneNumbersApi.unassignAssistant(phoneId, assistantId);
        toast.success('Assistant unassigned from phone number');
        setCurrentNumber(result);
        await fetchPhoneNumbers();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to unassign assistant';
        toast.error(message);
        throw err;
      }
    },
    [fetchPhoneNumbers]
  );

  const deletePhoneNumber = useCallback(
    async (id: number) => {
      try {
        await phoneNumbersApi.remove(id);
        toast.success('Phone number deleted successfully');
        await fetchPhoneNumbers();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete phone number';
        toast.error(message);
        throw err;
      }
    },
    [fetchPhoneNumbers]
  );

  const fetchPhoneNumber = useCallback(async (id: number) => {
    setDetailLoading(true);
    setError(null);
    try {
      const response = await phoneNumbersApi.retrieve(id);
      setCurrentNumber(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load phone number';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const updateParams = useCallback((newOptions: Partial<UsePhoneNumbersOptions>) => {
    setCurrentOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  // Auto-fetch when options change
  useEffect(() => {
    if (currentOptions.organizationId) {
      fetchPhoneNumbers({
        skip: currentOptions.skip ?? 0,
        limit: currentOptions.limit ?? 10,
        organization_id: currentOptions.organizationId,
        search: currentOptions.search,
        is_active: currentOptions.is_active,
        provider_id: currentOptions.provider_id,
      });
    } else {
      // No organization ID, set loading to false
      setLoading(false);
    }
  }, [currentOptions.organizationId, currentOptions.search, currentOptions.is_active, currentOptions.provider_id, currentOptions.limit, currentOptions.skip, fetchPhoneNumbers]);

  return {
    phoneNumbers,
    pagination,
    loading,
    error,
    detailLoading,
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
