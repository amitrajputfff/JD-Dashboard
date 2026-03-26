import { apiClient } from './client';
import { Call, CallFilters, BatchCallRequest, CallLog, CallLogsParams, CallLogsResponse } from '@/types/call';
import { PaginatedResponse, ApiResponse } from '@/types/api';
import { transformRecordingUrl } from '@/lib/utils';

export const callsApi = {
  // Get call logs with pagination and filters
  getCallLogs: async (params: CallLogsParams): Promise<CallLogsResponse> => {
    const searchParams = new URLSearchParams();
    
    // Add required organization_id
    searchParams.append('organization_id', params.organization_id);
    
    // Add pagination parameters with defaults
    searchParams.append('skip', (params.skip ?? 0).toString());
    searchParams.append('limit', (params.limit ?? 10).toString());
    
    // Add optional filters
    if (params.search) {
      searchParams.append('search', params.search);
    }
    
    if (params.status) {
      searchParams.append('status', params.status);
    }
    
    if (params.call_type) {
      searchParams.append('call_type', params.call_type);
    }

    const response = await apiClient.get<CallLogsResponse>(`/api/call-logs?${searchParams.toString()}`) as CallLogsResponse;
    
    // Transform S3 recording URLs to CloudFront URLs for all call logs
    if (response.call_logs) {
      response.call_logs = response.call_logs.map(log => ({
        ...log,
        recording_link: transformRecordingUrl(log.recording_link)
      }));
    }
    
    return response;
  },

  // Get call log by ID
  getCallLogById: async (id: string | number): Promise<CallLog> => {
    const response = await apiClient.get<CallLog>(`/api/call-logs/${id}`);
    const callLog = response as unknown as CallLog;
    
    // Transform S3 recording URL to CloudFront URL
    if (callLog.recording_link) {
      callLog.recording_link = transformRecordingUrl(callLog.recording_link);
    }
    
    return callLog;
  },

  // Get all calls with pagination and filters
  getCalls: async (params?: {
    page?: number;
    limit?: number;
    filters?: CallFilters;
  }): Promise<PaginatedResponse<Call>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'dateRange' && typeof value === 'object') {
            searchParams.append('startDate', value.start);
            searchParams.append('endDate', value.end);
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    return apiClient.get(`/calls?${searchParams.toString()}`) as Promise<PaginatedResponse<Call>>;
  },

  // Get call by ID
  getCall: async (id: string): Promise<ApiResponse<Call>> => {
    return apiClient.get(`/calls/${id}`);
  },

  // Get call recording URL
  getCallRecording: async (id: string): Promise<ApiResponse<{ recordingUrl: string }>> => {
    return apiClient.get(`/calls/${id}/recording`);
  },

  // Get call transcript
  getCallTranscript: async (id: string): Promise<ApiResponse<{ transcript: string }>> => {
    return apiClient.get(`/calls/${id}/transcript`);
  },

  // Generate AI summary for call
  generateSummary: async (id: string): Promise<ApiResponse<{ summary: string; sentiment: string }>> => {
    return apiClient.post(`/calls/${id}/generate-summary`);
  },

  // Create batch call campaign
  createBatchCall: async (data: BatchCallRequest): Promise<ApiResponse<{ campaignId: string }>> => {
    return apiClient.post('/calls/batch', data);
  },

  // Get batch call status
  getBatchCallStatus: async (campaignId: string): Promise<ApiResponse<Record<string, unknown>>> => {
    return apiClient.get(`/calls/batch/${campaignId}/status`);
  },

  // Cancel batch call campaign
  cancelBatchCall: async (campaignId: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/calls/batch/${campaignId}`);
  },

  // Export calls data
  exportCalls: async (filters?: CallFilters): Promise<ApiResponse<{ downloadUrl: string }>> => {
    return apiClient.post('/calls/export', { filters });
  },

  // Get call analytics
  getCallAnalytics: async (timeRange?: string): Promise<ApiResponse<Record<string, unknown>>> => {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    return apiClient.get(`/calls/analytics${params}`);
  },
};
