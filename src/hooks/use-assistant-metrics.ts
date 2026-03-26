import { useState, useCallback } from 'react';
import { AssistantMetrics } from '@/types/analytics';

export interface UseAssistantMetricsResult {
  data: AssistantMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: (timeRange?: string) => Promise<void>;
}

const buildMockMetrics = (assistantId: string, timeRange: string): AssistantMetrics => ({
  data: {
    overview: {
      totalCalls: 1247,
      successfulCalls: 973,
      failedCalls: 274,
      successRate: 78.03,
      avgCallDuration: 185,
      callsToday: 48,
      callsThisWeek: 312,
      callsThisMonth: 1247,
    },
    comparison: {
      totalCallsChange: 12.4,
      successRateChange: 2.1,
      avgDurationChange: -8,
      periodLabel: `vs previous ${timeRange}`,
    },
    callTrends: [
      { timestamp: '2026-03-20T00:00:00Z', totalCalls: 162, successfulCalls: 127, failedCalls: 35, avgDuration: 182 },
      { timestamp: '2026-03-21T00:00:00Z', totalCalls: 188, successfulCalls: 148, failedCalls: 40, avgDuration: 179 },
      { timestamp: '2026-03-22T00:00:00Z', totalCalls: 145, successfulCalls: 110, failedCalls: 35, avgDuration: 195 },
      { timestamp: '2026-03-23T00:00:00Z', totalCalls: 203, successfulCalls: 162, failedCalls: 41, avgDuration: 188 },
      { timestamp: '2026-03-24T00:00:00Z', totalCalls: 178, successfulCalls: 140, failedCalls: 38, avgDuration: 183 },
      { timestamp: '2026-03-25T00:00:00Z', totalCalls: 195, successfulCalls: 152, failedCalls: 43, avgDuration: 190 },
      { timestamp: '2026-03-26T00:00:00Z', totalCalls: 176, successfulCalls: 134, failedCalls: 42, avgDuration: 186 },
    ],
  },
} as any);

export function useAssistantMetrics(assistantId: string, timeRange: string = '7d'): UseAssistantMetricsResult {
  const [data] = useState<AssistantMetrics | null>(
    assistantId ? buildMockMetrics(assistantId, timeRange) : null
  );
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const refetch = useCallback(async (_selectedTimeRange?: string) => {
    // No-op for mock data
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
