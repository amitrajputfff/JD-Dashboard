import { useState, useCallback, useEffect } from 'react';
import { CallLog, CallLogsParams } from '@/types/call';
import { mockCallLogs } from '@/lib/mock-data/calls';

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
  const [error] = useState<string | null>(null);

  const fetchCallLogs = useCallback(async (params?: Partial<CallLogsParams>) => {
    setIsLoading(true);
    await new Promise(res => setTimeout(res, 300));

    let filtered = [...mockCallLogs];

    const q = (params?.search ?? search)?.toLowerCase();
    if (q) {
      filtered = filtered.filter(c =>
        c.from_number.includes(q) ||
        c.to_number.includes(q) ||
        (c.summary || '').toLowerCase().includes(q)
      );
    }

    const s = params?.status ?? status;
    if (s) filtered = filtered.filter(c => c.status === s);

    const ct = params?.call_type ?? callType;
    if (ct) filtered = filtered.filter(c => c.call_type === ct);

    const resolvedSkip = params?.skip ?? skip;
    const resolvedLimit = params?.limit ?? limit;
    const paginated = filtered.slice(resolvedSkip, resolvedSkip + resolvedLimit);

    setCallLogs(paginated);
    setTotal(filtered.length);
    setIsLoading(false);
  }, [skip, limit, search, status, callType]);

  const refetch = useCallback(() => fetchCallLogs(), [fetchCallLogs]);

  useEffect(() => {
    if (autoFetch) {
      fetchCallLogs();
    }
  }, [autoFetch, skip, limit, search, status, callType, fetchCallLogs]);

  return { callLogs, total, isLoading, error, refetch, fetchCallLogs };
}
