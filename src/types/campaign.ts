export interface Campaign {
  // API response fields
  campaign_id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'in_progress' | 'active' | 'paused' | 'completed' | 'cancelled' | 'failed';
  total_contacts: number;
  progress_percentage: number;
  success_rate: number;
  
  // Additional fields that may be present in detailed view
  id?: string;
  description?: string;
  assistant_id?: string;
  phone_number?: string;
  schedule_campaign?: boolean;
  schedule_time?: string;
  consent_required?: boolean;
  max_retries?: number;
  retry_delay_minutes?: number;
  call_timeout_seconds?: number;
  completed_calls?: number;
  failed_calls?: number;
  pending_calls?: number;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  organization_id?: string;
  assistantId?: string;
  assistantName?: string;
  phoneNumberId?: string;
  scheduledAt?: string;
  createdAt?: string;
  contactsCalled?: number;
  contactsAnswered?: number;
}

export interface CreateCampaignRequest {
  name: string;
  description: string;
  assistant_id: string;
  phone_number: string;
  phone_number_id: number[];
  organization_id?: string;
  schedule_campaign: boolean;
  schedule_time?: string;
  consent_required: boolean;
  max_retries: number;
  retry_delay_minutes: number;
  call_timeout_seconds: number;
  contacts?: CampaignContact[];
}

export interface CampaignContact {
  id: number;
  contact_id: string;
  campaign_id: number;
  name: string | null;
  phone_number: string;
  email: string | null;
  company: string | null;
  notes: string | null;
  variables?: Record<string, string>;
  status: 'pending' | 'calling' | 'completed' | 'failed' | 'in_progress';
  call_attempts: number;
  last_call_time: string | null;
  last_call_id: string | null;
  call_duration: number;
  outcome: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignListResponse {
  campaigns: Campaign[];
  total: number;
  skip: number;
  limit: number;
}

// API response type that matches the backend response structure
export interface CampaignsApiResponse {
  campaigns: Campaign[];
  total: number;
  skip: number;
  limit: number;
}

// Campaign details response with full information
export interface CampaignDetails extends Campaign {
  id: number;
  campaign_id: string;
  organization_id: string;
  name: string;
  description: string;
  assistant_id: string;
  phone_number_id: number[];
  status: 'draft' | 'scheduled' | 'in_progress' | 'active' | 'paused' | 'completed' | 'cancelled' | 'failed';
  schedule_campaign: boolean;
  schedule_time: string | null;
  started_at: string | null;
  completed_at: string | null;
  consent_required: boolean;
  max_retries: number;
  retry_delay_minutes: number;
  call_timeout_seconds: number;
  total_contacts: number;
  contacts_called: number;
  contacts_answered: number;
  failed_calls: number;
  pending_calls: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  success_rate: number;
  avg_call_duration: number;
  avg_response_time: number;
  answer_rate: number;
  contacts: {
    data: CampaignContact[];
    total: number;
    limit: number;
    skip: number;
  };
}

// Campaign details API response
export interface CampaignDetailsApiResponse {
  success: boolean;
  campaign: CampaignDetails;
}

export interface CampaignStats {
  total_campaigns: number;
  active_campaigns: number;
  scheduled_campaigns: number;
  completed_campaigns: number;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
}

export interface UploadContactsResponse {
  campaign_id: string;
  total_contacts: number;
  successful_imports: number;
  failed_imports: number;
  errors: string[];
  message: string;
}
