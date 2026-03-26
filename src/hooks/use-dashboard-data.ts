import { useState, useEffect, useCallback } from 'react';
import { mockDashboardData } from '@/lib/mock-data/dashboard';
import {
  CustomerServiceDashboardResponse,
  PerformanceAnalyticsResponse,
  RealTimeMonitoringResponse,
} from '@/types/analytics';

export function useCustomerServiceDashboard(
  _timeRange: string = 'today',
  _includeTrends: boolean = true,
  _includeAgentDetails: boolean = true
) {
  const [data, setData] = useState<CustomerServiceDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await new Promise(res => setTimeout(res, 400));
    setData(mockDashboardData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function usePerformanceAnalytics() {
  const [data] = useState<PerformanceAnalyticsResponse | null>(null);
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);

  return { data, loading, error, refetch: async () => {} };
}

export function useRealTimeMonitoring(_refreshInterval: number = 30000) {
  const [data] = useState<RealTimeMonitoringResponse | null>(null);
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);
  const [isLive, setIsLive] = useState(true);

  const toggleLive = useCallback(() => {
    setIsLive(prev => !prev);
  }, []);

  return { data, loading, error, isLive, toggleLive, refetch: async () => {} };
}
