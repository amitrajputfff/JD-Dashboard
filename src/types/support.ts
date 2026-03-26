export interface SupportTicket {
  id: number;
  type: 'technical' | 'bug' | 'feature' | 'question' | 'account' | 'issue';
  name: string;
  email: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  subject: string;
  description: string;
  organization_id: string | null;
  system_config: {
    browser?: string;
    operating_system?: string;
    userAgent?: string;
    timestamp?: string;
    steps_to_reproduce?: string;
    expected_behavior?: string;
    actual_behavior?: string;
  } | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface CreateSupportTicketRequest {
  type: 'technical' | 'bug' | 'feature' | 'question' | 'account' | 'issue';
  name: string;
  email: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  subject: string;
  description: string;
  system_config?: {
    browser?: string;
    operating_system?: string;
    steps_to_reproduce?: string;
    expected_behavior?: string;
    actual_behavior?: string;
  } | null;
}

export interface SupportTicketFilters {
  status?: SupportTicket['status'];
  priority?: SupportTicket['priority'];
  type?: SupportTicket['type'];
  category?: string;
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SupportTicketResponse extends SupportTicket {}

export interface SupportTicketsApiResponse {
  support_tickets: SupportTicket[];
  total: number;
  skip: number;
  limit: number;
}
