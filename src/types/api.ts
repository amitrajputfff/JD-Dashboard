export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
}

export interface AssistantsApiResponse {
  assistants: any[];
  total: number;
  skip: number;
  limit: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  status?: number;
  isPermissionError?: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface PhoneNumber {
  id: string;
  number: string;
  carrier: string;
  status: 'active' | 'inactive' | 'pending';
  agentId?: string;
  agentName?: string;
  monthlyRent: number;
  assignedAt?: string;
  createdAt: string;
}

export interface ExportDataRequest {
  organization_id: string;
  export_type: 'assistants' | 'call_logs' | 'phone_numbers';
  format: 'pdf' | 'csv';
  start_date: string;
  end_date: string;
  include_relationships?: boolean;
  include_metadata?: boolean;
}

// Export API returns the actual file content (PDF/CSV) as a blob, not a JSON response
