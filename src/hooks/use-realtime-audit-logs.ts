import { useState, useEffect, useCallback, useRef } from 'react';
import { auditApi } from '@/lib/api/audit';
import { AuditLog } from '@/types/audit';

export interface RealtimeAuditLogsOptions {
  organizationId?: string; // Made optional for all organizations
  limit?: number;
  skip?: number; // Changed from offset to skip for consistency
  pollInterval?: number; // in milliseconds
  autoRefresh?: boolean;
  allOrganizations?: boolean; // Flag to fetch logs from all organizations
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
    organizationId,
    limit = 10, // Default to 10 for pagination
    skip = 0,
    pollInterval = 5000, // 5 seconds default
    autoRefresh = true,
    allOrganizations = false,
    search,
    action,
    severity,
    status,
    user,
    resource,
    startDate,
    endDate
  } = options;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(autoRefresh);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Fetch audit logs from API
  const fetchLogs = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      let response;
      
      if (allOrganizations) {
        // Fetch logs from all organizations using all-filters endpoint
        response = await auditApi.getAllOrganizationsAuditLogs({
          limit,
          skip,
          search,
          action,
          severity,
          status,
          user,
          resource,
          start_date: startDate,
          end_date: endDate
        });
      } else if (organizationId) {
        // Fetch logs from specific organization
        response = await auditApi.getAuditLogs({
          organization_id: organizationId,
          limit,
          skip,
          search,
          action,
          severity,
          status,
          user,
          resource,
          start_date: startDate,
          end_date: endDate
        });
      } else {
        throw new Error('Either organizationId or allOrganizations flag must be provided');
      }

      if (isMountedRef.current) {
        // Sort logs by timestamp (newest first)
        const sortedLogs = response.data.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setLogs(sortedLogs);
        setTotalCount(response.total);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
      }
    } finally {
      if (isMountedRef.current && showLoading) {
        setIsLoading(false);
      }
    }
  }, [organizationId, allOrganizations, limit, skip, search, action, severity, status, user, resource, startDate, endDate]);

  // Start polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      fetchLogs(false); // Don't show loading on background polls
    }, pollInterval);

    setIsLive(true);
  }, [fetchLogs, pollInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsLive(false);
  }, []);

  // Toggle auto refresh
  const toggleAutoRefresh = useCallback(() => {
    if (isLive) {
      stopPolling();
    } else {
      startPolling();
    }
  }, [isLive, startPolling, stopPolling]);

  // Manual refresh
  const refresh = useCallback(async () => {
    await fetchLogs(true);
  }, [fetchLogs]);

  // Initialize and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial fetch
    fetchLogs(true);

    // Start polling if auto refresh is enabled
    if (autoRefresh) {
      startPolling();
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchLogs, startPolling, autoRefresh]);

  // Update polling when options change
  useEffect(() => {
    if (isLive) {
      startPolling();
    }
  }, [startPolling, isLive]);


  return {
    logs,
    isLoading,
    error,
    isLive,
    lastUpdated,
    totalCount,
    refresh,
    toggleAutoRefresh,
    startPolling,
    stopPolling
  };
}