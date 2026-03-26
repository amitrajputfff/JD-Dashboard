import { apiClient } from './client';
import { SupportTicket, CreateSupportTicketRequest, SupportTicketFilters, SupportTicketResponse, SupportTicketsApiResponse } from '@/types/support';
import { PaginatedResponse, ApiResponse } from '@/types/api';
import { authStorage } from '@/lib/auth-storage';

// Helper function to get organization ID
// const getOrganizationId = (): string => {
//   const user = authStorage.getUser();
//   const organizationId = user?.organization_id;
  
//   if (!organizationId) {
//     throw new Error('Organization ID not found. Please log in again.');
//   }
  
//   return organizationId;
// };

export const supportApi = {
  // Create a new support ticket
  createTicket: async (data: CreateSupportTicketRequest): Promise<SupportTicketResponse> => {
    const response = await apiClient.post('/api/support-tickets', data);
    // Backend returns the ticket data directly, not wrapped in {success, data}
    return response as unknown as SupportTicketResponse;
  },

  // Get all support tickets with pagination and filters
  getTickets: async (params?: {
    page?: number;
    limit?: number;
    filters?: SupportTicketFilters;
  }): Promise<PaginatedResponse<SupportTicket>> => {
    const searchParams = new URLSearchParams();
    
    // Convert page-based pagination to skip-based
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;
    
    searchParams.append('skip', skip.toString());
    searchParams.append('limit', limit.toString());
    
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'dateRange' && typeof value === 'object') {
            searchParams.append('startDate', value.start);
            searchParams.append('endDate', value.end);
          } else if (key === 'search') {
            // Handle search parameter mapping if needed
            searchParams.append('search', value.toString());
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    const response = await apiClient.get(`/api/support-tickets?${searchParams.toString()}`) as unknown as {
      support_tickets: SupportTicket[];
      total: number;
      skip: number;
      limit: number;
    };
    
    // Transform the response to match our expected PaginatedResponse structure
    const totalPages = Math.ceil(response.total / limit);
    
    return {
      data: response.support_tickets,
      pagination: {
        page: page,
        limit: limit,
        total: response.total,
        totalPages: totalPages
      },
      success: true
    };
  },

  // Get support ticket by ID
  getTicket: async (id: number): Promise<ApiResponse<SupportTicket>> => {
    const response = await apiClient.get(`/api/support-tickets/${id}`) as unknown as SupportTicket;
    
    // Transform the response to match our expected ApiResponse structure
    return {
      data: response,
      success: true
    };
  },

  // Update support ticket
  updateTicket: async (id: number, data: Partial<CreateSupportTicketRequest>): Promise<ApiResponse<SupportTicket>> => {
    const response = await apiClient.put(`/api/support-tickets/${id}`, data) as unknown as SupportTicket;
    return {
      data: response,
      success: true
    };
  },

  // Update ticket status
  updateTicketStatus: async (id: number, status: SupportTicket['status']): Promise<ApiResponse<SupportTicket>> => {
    const response = await apiClient.put(`/api/support-tickets/${id}`, { status }) as unknown as SupportTicket;
    return {
      data: response,
      success: true
    };
  },


  // Close ticket
  closeTicket: async (id: number): Promise<ApiResponse<SupportTicket>> => {
    const response = await apiClient.put(`/api/support-tickets/${id}`, { status: 'closed' }) as unknown as SupportTicket;
    return {
      data: response,
      success: true
    };
  },

  // Reopen ticket
  reopenTicket: async (id: number): Promise<ApiResponse<SupportTicket>> => {
    const response = await apiClient.put(`/api/support-tickets/${id}`, { status: 'open' }) as unknown as SupportTicket;
    return {
      data: response,
      success: true
    };
  },


  // Export support tickets
  exportTickets: async (filters?: SupportTicketFilters): Promise<ApiResponse<{ downloadUrl: string }>> => {
    return apiClient.post(`/api/support-tickets/export`, { filters });
  },
};
