import { apiClient } from './client';

export interface TemplateConfig {
  name: string;
  pitch: string;
  prompt: string;
  status: string;
  barge_in: boolean;
  category: string;
  voice_id: number;
  functions: any[];
  max_token: number;
  memory_enabled: boolean;
  max_memory_retrieval: number;
  description: string;
  language_id: number;
  temperature: number;
  llm_model_id: number;
  speech_speed: number;
  stt_model_id: number;
  tts_model_id: number;
  call_end_text: string;
  call_recording: boolean;
  cutoff_seconds: number;
  filler_message: string[];
  initial_message: string;
  silence_timeout: number;
  function_calling: boolean;
  max_call_duration: number;
  noise_suppression: boolean;
  ideal_time_seconds: number;
  interruption_level: string;
  function_filler_message: string[];
  voice_activity_detection: boolean;
}

export interface AgentTemplateResponse {
  id: number;
  template_id: string;
  name: string;
  description: string;
  category: string;
  level: string;
  estimated_setup_time: string;
  is_featured: boolean;
  is_active: boolean;
  template_config: TemplateConfig;
  created_by: string;
  usage_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface GetAllTemplatesResponse {
  templates: AgentTemplateResponse[];
  total: number;
  skip: number;
  limit: number;
}

export const templatesApi = {
  /**
   * Get all agent templates
   */
  getAllTemplates: async (params?: {
    skip?: number;
    limit?: number;
  }): Promise<GetAllTemplatesResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const url = `/api/templates/all${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<GetAllTemplatesResponse>(url);
  },

  /**
   * Get a specific template by ID
   */
  getTemplateById: async (templateId: string): Promise<AgentTemplateResponse> => {
    return apiClient.get<AgentTemplateResponse>(`/api/templates?template_id=${templateId}`);
  },
};
