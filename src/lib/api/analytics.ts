import { apiClient } from './client';
import { DashboardMetrics, AgentPerformance, CallTrends, TimeRange } from '@/types/analytics';
import { ApiResponse } from '@/types/api';

export interface DashboardStats {
  total_phone_numbers: number;
  active_phone_numbers: number;
  inactive_phone_numbers: number;
  phone_numbers_by_provider: Record<string, number>;
  recent_additions: number;
}

export const analyticsApi = {
  // Get dashboard overview metrics
  getDashboardMetrics: async (timeRange?: string): Promise<ApiResponse<DashboardMetrics>> => {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    return apiClient.get(`/analytics/dashboard${params}`);
  },

  // Get agent performance data
  getAgentPerformance: async (params?: {
    timeRange?: string;
    limit?: number;
    sortBy?: 'calls' | 'success_rate' | 'revenue';
  }): Promise<ApiResponse<AgentPerformance[]>> => {
    const searchParams = new URLSearchParams();
    if (params?.timeRange) searchParams.append('timeRange', params.timeRange);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);

    return apiClient.get(`/analytics/agents${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
  },

  // Get call trends over time
  getCallTrends: async (timeRange: TimeRange): Promise<ApiResponse<CallTrends[]>> => {
    return apiClient.post('/analytics/trends', timeRange);
  },

  // Get real-time metrics
  getRealTimeMetrics: async (): Promise<ApiResponse<{
    activeCalls: number;
    callsToday: number;
    avgWaitTime: number;
    systemStatus: 'healthy' | 'warning' | 'error';
  }>> => {
    return apiClient.get('/analytics/realtime');
  },

  // Get revenue analytics
  getRevenueAnalytics: async (timeRange?: string): Promise<ApiResponse<{
    totalRevenue: number;
    revenueByAgent: { agentId: string; agentName: string; revenue: number }[];
    revenueByDay: { date: string; revenue: number }[];
    avgRevenuePerCall: number;
  }>> => {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    return apiClient.get(`/analytics/revenue${params}`);
  },

  // Get cost analytics
  getCostAnalytics: async (timeRange?: string): Promise<ApiResponse<{
    totalCost: number;
    costPerCall: number;
    costByAgent: { agentId: string; agentName: string; cost: number }[];
    costTrend: { date: string; cost: number }[];
  }>> => {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    return apiClient.get(`/analytics/costs${params}`);
  },

  // Export analytics report
  exportReport: async (params: {
    type: 'agents' | 'calls' | 'revenue' | 'costs';
    timeRange: string;
    format: 'csv' | 'pdf';
  }): Promise<ApiResponse<{ downloadUrl: string }>> => {
    return apiClient.post('/analytics/export', params);
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get<DashboardStats>('/api/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Return default stats if API fails
      return {
        total_phone_numbers: 0,
        active_phone_numbers: 0,
        inactive_phone_numbers: 0,
        phone_numbers_by_provider: {},
        recent_additions: 0
      };
    }
  },

  // Get assistant metrics
  getAssistantMetrics: async (_assistantId: string, _timeRange: string = '7d'): Promise<ApiResponse<any>> => {
    return { data: null };
  },

  // Get 6-month performance analytics
  getPerformanceAnalytics: async (_organizationId: string): Promise<any> => {
    return null;
  },

  // Get customer service dashboard metrics
  getCustomerServiceDashboard: async (_params: {
    organizationId: string;
    timeRange?: string;
    includeTrends?: boolean;
    includeAgentDetails?: boolean;
  }): Promise<any> => {
    return null;
  },

  // Get real-time monitoring data
  getRealTimeMonitoring: async (_organizationId: string): Promise<any> => {
    return null;
  }
};
