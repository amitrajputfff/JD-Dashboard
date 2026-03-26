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
  getAssistantMetrics: async (assistantId: string, timeRange: string = '7d'): Promise<ApiResponse<any>> => {
    try {
      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch(`https://backend.liaplus.com/backend/api/assistants/${assistantId}/metrics?timeRange=${timeRange}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Failed to fetch assistant metrics:', error);
      throw error;
    }
  },

  // Get 6-month performance analytics
  getPerformanceAnalytics: async (organizationId: string): Promise<any> => {
    try {
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch(`https://backend.liaplus.com/backend/api/customer-service/performance-analytics?organization_id=${organizationId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch performance analytics:', error);
      throw error;
    }
  },

  // Get customer service dashboard metrics
  getCustomerServiceDashboard: async (params: {
    organizationId: string;
    timeRange?: string;
    includeTrends?: boolean;
    includeAgentDetails?: boolean;
  }): Promise<any> => {
    try {
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const searchParams = new URLSearchParams();
      searchParams.append('organization_id', params.organizationId);
      if (params.timeRange) searchParams.append('time_range', params.timeRange);
      if (params.includeTrends !== undefined) searchParams.append('include_trends', String(params.includeTrends));
      if (params.includeAgentDetails !== undefined) searchParams.append('include_agent_details', String(params.includeAgentDetails));

      const response = await fetch(`https://backend.liaplus.com/backend/api/customer-service/dashboard?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch customer service dashboard:', error);
      throw error;
    }
  },

  // Get real-time monitoring data
  getRealTimeMonitoring: async (organizationId: string): Promise<any> => {
    try {
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch(`https://backend.liaplus.com/backend/api/real-time-monitoring?organization_id=${organizationId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch real-time monitoring:', error);
      throw error;
    }
  }
};
