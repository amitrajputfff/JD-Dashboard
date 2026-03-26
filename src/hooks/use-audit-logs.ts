import { useState, useCallback } from 'react';
import { AuditLog } from '@/types/audit';
import { mockAuditLogs } from '@/lib/mock-data/audit-logs';

export interface UseAuditLogsOptions {
  organizationId?: string;
  allOrganizations?: boolean;
  search?: string;
  action?: string;
  severity?: string;
  status?: string;
  user?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
}

export interface UseAuditLogsReturn {
  logs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  refresh: () => Promise<void>;
  fetchLogs: (page: number, itemsPerPage: number) => Promise<void>;
  currentPage: number;
  totalPages: number;
}

export function useAuditLogs(options: UseAuditLogsOptions): UseAuditLogsReturn {
  const { search, action, severity, status, sortBy = 'timestamp' } = options;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchLogs = useCallback(async (page: number, itemsPerPage: number) => {
    setIsLoading(true);
    await new Promise(res => setTimeout(res, 300));

    let filtered = [...mockAuditLogs];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(l =>
        l.action.includes(q) ||
        l.user.name.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q)
      );
    }
    if (action) filtered = filtered.filter(l => l.action === action);
    if (severity) filtered = filtered.filter(l => l.severity === severity);
    if (status) filtered = filtered.filter(l => l.status === status);

    switch (sortBy) {
      case 'user':
        filtered.sort((a, b) => a.user.name.localeCompare(b.user.name));
        break;
      case 'action':
        filtered.sort((a, b) => a.action.localeCompare(b.action));
        break;
      case 'severity': {
        const order: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => (order[b.severity] || 0) - (order[a.severity] || 0));
        break;
      }
      default:
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    const total = filtered.length;
    const start = (page - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    setLogs(paginated);
    setTotalCount(total);
    setCurrentPage(page);
    setTotalPages(Math.ceil(total / itemsPerPage));
    setIsLoading(false);
  }, [search, action, severity, status, sortBy]);

  const refresh = useCallback(async () => {
    await fetchLogs(1, 10);
  }, [fetchLogs]);

  return { logs, isLoading, error, totalCount, refresh, fetchLogs, currentPage, totalPages };
}
