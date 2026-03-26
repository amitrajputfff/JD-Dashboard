import { apiClient } from './client';
import { AuditLog, AuditLogFilter, AuditLogStats } from '@/types/audit';

// Constants
const DEFAULT_LIMIT_FOR_ALL_DATA = 1000; // Use 1000 limit for getting all user data

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number; // Total count of records
  limit: number;
  skip: number; // Changed from offset to skip for consistency
  hasMore?: boolean; // Indicates if there might be more data available
}

export interface AuditLogsParams {
  organization_id?: string; // Made optional to support all organizations
  user_id?: string;
  limit?: number;
  skip?: number; // Changed from offset to skip for consistency
  search?: string;
  action?: string;
  severity?: string;
  status?: string;
  user?: string;
  resource?: string;
  resource_id?: string;
  start_date?: string;
  end_date?: string;
  since?: string; // Get logs newer than this timestamp for real-time updates
  all_organizations?: boolean; // Flag to fetch from all organizations
}

export const auditApi = {
  /**
   * Fetch audit logs with pagination and filtering using all-filters endpoint
   */
  getAuditLogs: async (params: AuditLogsParams): Promise<AuditLogsResponse> => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add organization_id only if specified and not fetching all organizations
      if (params.organization_id && !params.all_organizations) {
        queryParams.append('organization_id', params.organization_id);
      }
      
      // Set default pagination values
      const limit = params.limit || 10;
      const offset = params.skip || 0; // API uses 'offset' parameter
      
      // Optional parameters for all-filters endpoint
      if (params.user_id) queryParams.append('user_id', params.user_id);
      queryParams.append('limit', limit.toString());
      queryParams.append('offset', offset.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.action) queryParams.append('action', params.action);
      if (params.resource) queryParams.append('resource', params.resource);
      if (params.resource_id) queryParams.append('resource_id', params.resource_id);
      if (params.severity) queryParams.append('severity', params.severity);
      if (params.status) queryParams.append('status', params.status);
      if (params.user) queryParams.append('user', params.user);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.since) queryParams.append('since', params.since);

      // Use the all-filters endpoint for better filtering capabilities
      const response = await apiClient.get<AuditLog[]>(`/api/audit/logs/all-filters?${queryParams.toString()}`);
      
      // The apiClient.get() returns response.data, so we get the array directly
      const data = Array.isArray(response) ? response : [];
      
      const hasMore = data.length === limit; // If we got exactly the limit, there might be more data
      
      // For now, estimate total count based on current page and data length
      // In a real implementation, the API should return total count in headers or response metadata
      const estimatedTotal = hasMore ? (offset + limit) + 1 : offset + data.length;
      
      return {
        data,
        total: estimatedTotal,
        limit,
        skip: offset, // Keep skip in response for consistency
        hasMore
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  /**
   * Fetch audit logs for all organizations using the all-filters endpoint
   */
  getAllOrganizationsAuditLogs: async (params: Omit<AuditLogsParams, 'organization_id' | 'all_organizations'>): Promise<AuditLogsResponse> => {
    return auditApi.getAuditLogs({
      ...params,
      all_organizations: true,
      limit: params.limit || 10, // Default to 10 for pagination
      skip: params.skip || 0
    });
  },

  /**
   * Get audit log statistics for all organizations
   */
  getAllAuditStats: async (): Promise<AuditLogStats> => {
    try {
      const response = await auditApi.getAllOrganizationsAuditLogs({
        limit: DEFAULT_LIMIT_FOR_ALL_DATA
      });

      const logs = response.data;
      
      const stats: AuditLogStats = {
        totalLogs: logs.length,
        successfulActions: logs.filter(log => log.status === 'success').length,
        failedActions: logs.filter(log => log.status === 'failure').length,
        warningActions: logs.filter(log => log.status === 'warning').length,
        activeUsers: new Set(logs.map(log => log.user.id)).size,
        highSeverityLogs: logs.filter(log => log.severity === 'high').length,
        criticalSeverityLogs: logs.filter(log => log.severity === 'critical').length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      throw error;
    }
  },

  /**
   * Get audit log statistics for a specific organization
   */
  getAuditStats: async (organizationId: string): Promise<AuditLogStats> => {
    try {
      const response = await auditApi.getAuditLogs({
        organization_id: organizationId,
        limit: DEFAULT_LIMIT_FOR_ALL_DATA
      });

      const logs = response.data;
      
      const stats: AuditLogStats = {
        totalLogs: logs.length,
        successfulActions: logs.filter(log => log.status === 'success').length,
        failedActions: logs.filter(log => log.status === 'failure').length,
        warningActions: logs.filter(log => log.status === 'warning').length,
        activeUsers: new Set(logs.map(log => log.user.id)).size,
        highSeverityLogs: logs.filter(log => log.severity === 'high').length,
        criticalSeverityLogs: logs.filter(log => log.severity === 'critical').length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      throw error;
    }
  },

  /**
   * Export audit logs
   */
  exportAuditLogs: async (params: AuditLogsParams, format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
    try {
      const response = await auditApi.getAuditLogs(params);
      const logs = response.data;

      if (format === 'csv') {
        const csvContent = [
          'Timestamp,Organization,User,Action,Resource,Details,IP Address,Status,Severity',
          ...logs.map(log => 
            `"${log.timestamp}","${log.organizationId}","${log.user.name}","${log.action}","${log.resource}","${log.details}","${log.ipAddress}","${log.status}","${log.severity}"`
          )
        ].join('\n');

        return new Blob([csvContent], { type: 'text/csv' });
      } else {
        return new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }
};