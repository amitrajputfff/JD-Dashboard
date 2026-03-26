import { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '@/lib/api/analytics';
import { AssistantMetrics } from '@/types/analytics';
import { ApiResponse } from '@/types/api';

export interface UseAssistantMetricsResult {
  data: AssistantMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: (timeRange?: string) => Promise<void>;
}

export function useAssistantMetrics(assistantId: string, timeRange: string = '7d'): UseAssistantMetricsResult {
  const [data, setData] = useState<AssistantMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (selectedTimeRange?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getAssistantMetrics(assistantId, selectedTimeRange || timeRange);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assistant metrics');
      console.error('Assistant metrics error:', err);
    } finally {
      setLoading(false);
    }
  }, [assistantId, timeRange]);

  useEffect(() => {
    if (assistantId) {
      fetchMetrics();
    }
  }, [assistantId, timeRange, fetchMetrics]);

  return {
    data,
    loading,
    error,
    refetch: fetchMetrics,
  };
}
