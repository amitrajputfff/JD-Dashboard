import { useState, useCallback, useEffect } from 'react';
import { CallLog, CallLogsParams } from '@/types/call';
import { callsApi } from '@/lib/api/calls';

export interface UseCallLogsOptions {
  organizationId: string;
  skip?: number;
  limit?: number;
  search?: string;
  status?: string;
  callType?: string;
  autoFetch?: boolean;
}

export interface UseCallLogsReturn {
  callLogs: CallLog[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fetchCallLogs: (params?: Partial<CallLogsParams>) => Promise<void>;
}

export function useCallLogs(options: UseCallLogsOptions): UseCallLogsReturn {
  const {
    organizationId,
    skip = 0,
    limit = 10,
    search,
    status,
    callType,
    autoFetch = true,
  } = options;

  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCallLogs = useCallback(async (params?: Partial<CallLogsParams>) => {
    if (!organizationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await callsApi.getCallLogs({
        organization_id: params?.organization_id ?? organizationId,
        skip: params?.skip ?? skip,
        limit: params?.limit ?? limit,
        search: params?.search ?? search,
        status: params?.status ?? status,
        call_type: params?.call_type ?? callType,
      });

      setCallLogs(response.call_logs);
      setTotal(response.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load call logs';
      setError(message);
      setCallLogs([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, skip, limit, search, status, callType]);

  const refetch = useCallback(() => fetchCallLogs(), [fetchCallLogs]);

  useEffect(() => {
    if (autoFetch && organizationId) {
      fetchCallLogs();
    }
  }, [autoFetch, organizationId, skip, limit, search, status, callType, fetchCallLogs]);

  return { callLogs, total, isLoading, error, refetch, fetchCallLogs };
}
