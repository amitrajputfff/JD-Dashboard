export interface PhoneNumberAssistant {
  id: number;
  assistant_id: string;
  name: string;
  status: string;
  is_active: boolean;
}

export interface PhoneNumberProvider {
  id: number;
  name: string;
  service_type: string;
  description: string | null;
  website: string | null;
  region: string | null;
  is_active: boolean;
  metadata_json: Record<string, unknown> | null;
}

export interface PhoneNumber {
  organization_id: string;
  name: string | null;
  provider_id: number;
  phone_number: string;
  type: string | null;
  description: string | null;
  id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  mapped_assistant: PhoneNumberAssistant | null;
}

export interface PhoneNumberDetail extends PhoneNumber {
  provider: PhoneNumberProvider | null;
}

export interface PhoneNumberListResponse {
  phone_numbers: PhoneNumber[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePhoneNumberRequest {
  phone_number: string;
  provider_id: number;
  organization_id: string;
  is_active: boolean;
  name?: string | null;
  type?: string | null;
  description?: string | null;
}

export interface UpdatePhoneNumberRequest {
  phone_number?: string;
  is_active?: boolean;
  name?: string | null;
  type?: string | null;
  description?: string | null;
}
