import { useState, useCallback } from 'react';
import { AuditLog } from '@/types/audit';
import { mockAuditLogs } from '@/lib/mock-data/audit-logs';

export interface RealtimeAuditLogsOptions {
  organizationId?: string;
  limit?: number;
  skip?: number;
  pollInterval?: number;
  autoRefresh?: boolean;
  allOrganizations?: boolean;
  search?: string;
  action?: string;
  severity?: string;
  status?: string;
  user?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
}

export interface RealtimeAuditLogsReturn {
  logs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  isLive: boolean;
  lastUpdated: Date | null;
  totalCount: number;
  refresh: () => Promise<void>;
  toggleAutoRefresh: () => void;
  startPolling: () => void;
  stopPolling: () => void;
}

export function useRealtimeAuditLogs(options: RealtimeAuditLogsOptions): RealtimeAuditLogsReturn {
  const {
    limit = 10,
    skip = 0,
    search,
    action,
    severity,
    status,
    user,
    resource,
    startDate,
    endDate,
  } = options;

  const [isLive, setIsLive] = useState(false);
  const [lastUpdated] = useState<Date | null>(new Date());

  // Apply filters to mock data
  let filtered = [...mockAuditLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.action.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q) ||
        log.resource.toLowerCase().includes(q)
    );
  }
  if (action) {
    filtered = filtered.filter((log) => log.action === action);
  }
  if (severity) {
    filtered = filtered.filter((log) => log.severity === severity);
  }
  if (status) {
    filtered = filtered.filter((log) => log.status === status);
  }
  if (user) {
    const u = user.toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.user?.name?.toLowerCase().includes(u) ||
        log.user?.email?.toLowerCase().includes(u)
    );
  }
  if (resource) {
    filtered = filtered.filter((log) => log.resource === resource);
  }
  if (startDate) {
    const start = new Date(startDate).getTime();
    filtered = filtered.filter((log) => new Date(log.timestamp).getTime() >= start);
  }
  if (endDate) {
    const end = new Date(endDate).getTime();
    filtered = filtered.filter((log) => new Date(log.timestamp).getTime() <= end);
  }

  const totalCount = filtered.length;
  const logs = filtered.slice(skip, skip + limit);

  const refresh = useCallback(async () => {
    // No-op for mock data – data is always current
  }, []);

  const startPolling = useCallback(() => {
    setIsLive(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsLive(false);
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setIsLive((prev) => !prev);
  }, []);

  return {
    logs,
    isLoading: false,
    error: null,
    isLive,
    lastUpdated,
    totalCount,
    refresh,
    toggleAutoRefresh,
    startPolling,
    stopPolling,
  };
}
