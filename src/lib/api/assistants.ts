import { apiClient } from './client';

// Assistant API types
export interface AssistantDetails {
  organization_id: string;
  name: string;
  tags: string[];
  category: string;
  status: string;
  language_id: number;
  stt_model_id: number;
  tts_model_id: number;
  llm_model_id: number;
  voice_id: number;
  prompt: string;
  speech_speed: number;
  pitch: string;
  interruption_level: string;
  cutoff_seconds: number;
  ideal_time_seconds: number;
  call_end_text: string;
  max_token: number;
  temperature: number;
  memory_enabled: boolean;
  max_memory_retrieval: number;
  initial_message: string;
  call_recording: boolean;
  barge_in: boolean;
  voice_activity_detection: boolean;
  noise_suppression: boolean;
  function_calling: boolean;
  functions: AssistantFunction[];
  max_call_duration: number;
  silence_timeout: number;
  is_transferable: boolean;
  transfer_number: string | null;
  description: string;
  filler_message: string[];
  function_filler_message: string[];
  // Prompt Config
  language: string;
  script_rule: string;
  opening_instruction: string;
  closing_instruction: string;
  timeout_message: string;
  // Gemini VAD
  gemini_start_sensitivity: string;
  gemini_end_sensitivity: string;
  gemini_silence_duration_ms: number;
  gemini_prefix_padding_ms: number;
  id: number;
  assistant_id: string;
  training_status: string;
  logo_file_url: string | null;
  logo_file_type: string | null;
  logo_file_size: number | null;
  is_active: boolean;
  is_deleted: boolean;
  deleted_until: string | null;
  created_at: string;
  updated_at: string;
  calls_today: number;
  avg_duration: string;
  last_active: string;
}

// Type alias for API assistant response
export type ApiAssistant = AssistantDetails;

export interface AssistantFunction {
  url: string;
  name: string;
  method: string;
  schema: Record<string, any>;
  headers: Record<string, any>;
  body_format: string;
  custom_body: string;
  description: string;
  query_params: Record<string, any>;
}

export interface UpdateAssistantRequest {
  name: string;
  description: string;
  tags: string[];
  speech_speed: number;
  pitch: string;
  call_recording: boolean;
  voice_activity_detection: boolean;
  barge_in: boolean;
  noise_suppression: boolean;
  max_call_duration: number;
  silence_timeout: number;
  cutoff_seconds: number;
  ideal_time_seconds: number;
  is_transferable: boolean;
  transfer_number: string | null;
  initial_message: string;
  call_end_text: string;
  filler_message: string[];
  function_filler_message: string[];
  function_calling: boolean;
  functions: AssistantFunction[];
  llm_model_id: number;
  prompt: string;
  temperature: number;
  max_token: number;
  memory_enabled: boolean;
  max_memory_retrieval: number;
  voice_id: number;
  tts_model_id: number;
  stt_model_id: number;
  language_id: number;
  status: string;
  // Prompt Config
  language?: string;
  script_rule?: string;
  opening_instruction?: string;
  closing_instruction?: string;
  timeout_message?: string;
  // Gemini VAD
  gemini_start_sensitivity?: string;
  gemini_end_sensitivity?: string;
  gemini_silence_duration_ms?: number;
  gemini_prefix_padding_ms?: number;
}

export interface Provider {
  id: number;
  name: string;
  service_type: 'llm' | 'stt' | 'tts';
  description?: string;
}

export interface LLMModel {
  id: number;
  model_name: string;
  provider_id: number;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  provider?: {
    name: string;
    service_type: string;
    website?: string;
    region?: string;
    id: number;
    is_active: boolean;
  };
}

export interface STTModel {
  id: number;
  model_name: string;
  provider_id: number;
  description?: string;
  supported_languages?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  provider?: {
    name: string;
    service_type: string;
    website?: string;
    region?: string;
    id: number;
    is_active: boolean;
  };
}

export interface TTSModel {
  id: number;
  model_name: string;
  provider_id: number;
  description?: string;
  supported_languages?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  provider?: {
    name: string;
    service_type: string;
    website?: string;
    region?: string;
    id: number;
    is_active: boolean;
  };
}

export interface Voice {
  id: number;
  voice_name: string;
  tts_model_id: number;
  gender?: string;
  is_active?: boolean;
  tts_model?: {
    provider_id: number;
    model_name: string;
    description?: string;
    supported_languages?: string[];
    id: number;
    is_active: boolean;
  };
}

export interface Language {
  id: number;
  code: string;
  name: string;
}

export interface CreateAssistantRequest {
  name: string;
  description?: string;
  organization_id: string;
  prompt: string;
  llm_model_id: number | null;
  stt_model_id: number | null;
  tts_model_id: number | null;
  voice_id: number | null;
  language_id: number;
  tags?: string[];
  category?: string;
  status: string;
  speech_speed?: number;
  pitch?: string;
  max_token?: number;
  temperature?: number;
  memory_enabled?: boolean;
  max_memory_retrieval?: number;
  call_recording?: boolean;
  barge_in?: boolean;
  voice_activity_detection?: boolean;
  noise_suppression?: boolean;
  function_calling?: boolean;
  functions?: any[] | null;
  max_call_duration?: number;
  silence_timeout?: number;
  // Missing fields that should be included
  cutoff_seconds?: number;
  ideal_time_seconds?: number;
  initial_message?: string;
  call_end_text?: string;
  filler_message?: string[];
  function_filler_message?: string[];
  is_transferable?: boolean;
  transfer_number?: string | null;
  interruption_level?: string;
  // Knowledge base fields
  knowledge_base_enabled?: boolean;
  knowledge_documents?: string[];
  knowledge_datasets?: string[];
  knowledge_similarity_threshold?: number;
  knowledge_max_results?: number;
}

export interface CreateAssistantResponse {
  id: string;
  name: string;
  status: string;
}

export const assistantsApi = {
  // Get organization ID from current user
  async getOrganizationId(): Promise<string> {
    try {
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        const user = authStorage.getUser();
        if (user && user.organization_id) {
          return user.organization_id;
        }
      }
    } catch (error) {
      console.error('Failed to get organization ID:', error);
    }
    return 'default-org';
  },

  // Get assistants with pagination and filters
  async getAssistants(organizationId?: string, skip = 0, limit = 10, isDeleted = false): Promise<{ assistants: any[]; total: number }> {
    try {
      // Get organization ID if not provided
      const orgId = organizationId || await this.getOrganizationId();

      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const searchParams = new URLSearchParams();
      searchParams.append('skip', skip.toString());
      searchParams.append('limit', limit.toString());
      searchParams.append('organization_id', orgId);
      searchParams.append('is_deleted', isDeleted.toString());

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/assistants?${searchParams.toString()}`, {
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

      return response.json();
    } catch (error) {
      console.error('Failed to fetch assistants:', error);
      throw error;
    }
  },

  // Fetch providers by service type
  async getProviders(serviceType: 'llm' | 'stt' | 'tts', skip = 0, limit = 10): Promise<{ providers: Provider[]; total: number }> {
    try {
      // Get organization ID
      const orgId = await this.getOrganizationId();
      if (!orgId) {
        console.warn('No organization mapped - returning empty providers list');
        return {
          providers: [],
          total: 0
        };
      }

      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      // Add is_active=true to only fetch active providers
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/providers?skip=${skip}&limit=${limit}&service_type=${serviceType}&organization_id=${orgId}&is_active=true`, {
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
      
      // Handle different response structures
      const allProviders = data.providers || data.data?.providers || data || [];
      
      // Client-side filtering to ensure only active providers are returned
      const activeProviders = Array.isArray(allProviders) 
        ? allProviders.filter(provider => provider.is_active === true)
        : [];
      
      return {
        providers: activeProviders,
        total: activeProviders.length
      };
    } catch (error) {
      console.error(`Failed to fetch ${serviceType} providers:`, error);
      // Return empty list if API fails
      return {
        providers: [],
        total: 0
      };
    }
  },

  // Fetch LLM models by provider ID
  async getLLMModels(providerId: number, skip = 0, limit = 10): Promise<{ models: LLMModel[]; total: number }> {
    try {
      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/llm-models?skip=${skip}&limit=${limit}&provider_id=${providerId}`, {
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
      
      // Handle the correct field name from API response
      const models = data.llm_models || data.models || data.data?.llm_models || data.data?.models || [];
      const total = data.total || data.data?.total || models.length;
      
      // Only return default model if the API returns an empty array
      if (!Array.isArray(models) || models.length === 0) {
        return {
          models: [{ id: 0, model_name: 'Default LLM Model', provider_id: providerId }],
          total: 1
        };
      }
      
      return {
        models: models,
        total
      };
    } catch (error) {
      console.error('Failed to fetch LLM models:', error);
      // Return default model if API fails
      return {
        models: [{ id: 0, model_name: 'Default LLM Model', provider_id: providerId }],
        total: 1
      };
    }
  },

  // Fetch STT models by provider ID
  async getSTTModels(providerId: number, skip = 0, limit = 10): Promise<{ models: STTModel[]; total: number }> {
    try {
      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/stt-models?skip=${skip}&limit=${limit}&provider_id=${providerId}`, {
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
      
      // Handle the correct field name from API response
      const models = data.stt_models || data.models || data.data?.stt_models || data.data?.models || [];
      const total = data.total || data.data?.total || models.length;
      
      // Only return default model if the API returns an empty array
      if (!Array.isArray(models) || models.length === 0) {
        return {
          models: [{ id: 0, model_name: 'Default STT Model', provider_id: providerId }],
          total: 1
        };
      }
      
      return {
        models: models,
        total
      };
    } catch (error) {
      console.error('Failed to fetch STT models:', error);
      // Return default model if API fails
      return {
        models: [{ id: 0, model_name: 'Default STT Model', provider_id: providerId }],
        total: 1
      };
    }
  },

  // Fetch TTS models by provider ID
  async getTTSModels(providerId: number, skip = 0, limit = 10): Promise<{ models: TTSModel[]; total: number }> {
    try {
      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/tts-models?skip=${skip}&limit=${limit}&provider_id=${providerId}`, {
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
      
      // Handle the correct field name from API response
      const models = data.tts_models || data.models || data.data?.tts_models || data.data?.models || [];
      const total = data.total || data.data?.total || models.length;
      
      // Only return default model if the API returns an empty array
      if (!Array.isArray(models) || models.length === 0) {
        return {
          models: [{ id: 0, model_name: 'Default TTS Model', provider_id: providerId }],
          total: 1
        };
      }
      
      return {
        models: models,
        total
      };
    } catch (error) {
      console.error('Failed to fetch TTS models:', error);
      // Return default model if API fails
      return {
        models: [{ id: 0, model_name: 'Default TTS Model', provider_id: providerId }],
        total: 1
      };
    }
  },

  // Fetch voices by TTS model ID
  async getVoices(ttsModelId: number, skip = 0, limit = 1000): Promise<{ voices: Voice[]; total: number }> {
    try {
      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/voices?skip=${skip}&limit=${limit}&tts_model_id=${ttsModelId}`, {
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
      
      // Handle the correct field name from API response
      const voices = data.voices || data.data?.voices || [];
      const total = data.total || data.data?.total || voices.length;
      
      // Only return default voice if the API returns an empty array
      if (!Array.isArray(voices) || voices.length === 0) {
        return {
          voices: [{ id: 0, voice_name: 'Default Voice', tts_model_id: ttsModelId }],
          total: 1
        };
      }
      
      return {
        voices: voices,
        total
      };
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      // Return default voice if API fails
      return {
        voices: [{ id: 0, voice_name: 'Default Voice', tts_model_id: ttsModelId }],
        total: 1
      };
    }
  },

  // Fetch languages
  async getLanguages(): Promise<{ languages: Language[]; total: number }> {
    try {
      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch('${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/languages', {
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
      
      // Handle different response structures
      const languages = data.languages || data.data?.languages || data || [];
      const total = data.total || data.data?.total || languages.length;
      
      return {
        languages: Array.isArray(languages) ? languages : [],
        total
      };
    } catch (error) {
      console.error('Failed to fetch languages:', error);
      // Return default language if API fails
      return {
        languages: [{ id: 11, code: 'en', name: 'English' }],
        total: 1
      };
    }
  },

  // Create assistant
  async createAssistant(data: CreateAssistantRequest): Promise<CreateAssistantResponse> {
    try {
      const response = await apiClient.post<CreateAssistantResponse>('/api/assistants', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create assistant:', error);
      throw error;
    }
  },

  // Create AI-powered assistant
  async createAIAssistant(data: {
    name: string;
    description: string;
    language_id: number;
    prompt: string;
  }): Promise<{ success: boolean; message: string; assistant: AssistantDetails }> {
    try {
      // Get token and organization ID from auth storage
      let token = '';
      let organizationId = '';
      
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
        const user = authStorage.getUser();
        organizationId = user?.organization_id || '';
      }

      if (!organizationId) {
        organizationId = 'default-org';
      }

      const requestBody = {
        organization_id: organizationId,
        name: data.name,
        category: 'Customer Support',
        description: data.description,
        tags: [],
        generate_description: true,
        generate_tags: true,
        generate_config: true,
        language_id: data.language_id,
        stt_model_id: 1,
        tts_model_id: 1,
        llm_model_id: 1,
        voice_id: 1,
        prompt: data.prompt,
      };

      const response = await fetch('${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/assistants/ai-create', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to create AI assistant:', error);
      throw error;
    }
  },

  // Get assistant details by ID
  async getAssistant(assistantId: string): Promise<AssistantDetails> {
    try {
      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/assistants/${assistantId}`, {
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

      return response.json();
    } catch (error) {
      console.error('Failed to fetch assistant details:', error);
      throw error;
    }
  },

  // Get detailed assistant configuration (alias for getAssistant)
  async getAssistantDetailed(assistantId: string): Promise<AssistantDetails> {
    return this.getAssistant(assistantId);
  },

  // Update assistant
  async updateAssistant(assistantId: string, data: UpdateAssistantRequest): Promise<AssistantDetails> {
    try {
      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/assistants/${assistantId}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to update assistant:', error);
      throw error;
    }
  },

  // Get LLM model by ID
  async getLLMModelById(modelId: number): Promise<any> {
    try {
      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/llm-models/${modelId}`, {
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

      return response.json();
    } catch (error) {
      console.error('Failed to fetch LLM model:', error);
      throw error;
    }
  },

  // Get TTS model by ID
  async getTTSModelById(modelId: number): Promise<any> {
    try {
      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/tts-models/${modelId}`, {
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

      return response.json();
    } catch (error) {
      console.error('Failed to fetch TTS model:', error);
      throw error;
    }
  },

  // Get STT model by ID
  async getSTTModelById(modelId: number): Promise<any> {
    try {
      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/stt-models/${modelId}`, {
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

      return response.json();
    } catch (error) {
      console.error('Failed to fetch STT model:', error);
      throw error;
    }
  },

  // Get voice by ID
  async getVoiceById(voiceId: number): Promise<any> {
    try {
      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/voices/${voiceId}`, {
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

      return response.json();
    } catch (error) {
      console.error('Failed to fetch voice:', error);
      throw error;
    }
  },

  // Delete assistant (soft delete)
  async deleteAssistant(assistantId: string): Promise<any> {
    try {
      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/assistants/${assistantId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to delete assistant:', error);
      throw error;
    }
  },

  // Clone assistant
  async cloneAssistant(assistantId: string, options?: { new_name?: string }): Promise<any> {
    try {
      // Get token from auth storage
      let token = '';
      if (typeof window !== 'undefined') {
        const { authStorage } = await import('../auth-storage');
        token = authStorage.getAccessToken() || '';
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/backend/api/assistants/${assistantId}/clone`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: options ? JSON.stringify(options) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to clone assistant:', error);
      throw error;
    }
  }
};

// Helper function to map API assistant response to Agent type
export function mapApiAssistantToAgent(apiAssistant: AssistantDetails): any {
  return {
    id: apiAssistant.assistant_id,
    name: apiAssistant.name,
    description: apiAssistant.description,
    status: apiAssistant.status,
    organization_id: apiAssistant.organization_id,
    tags: apiAssistant.tags,
    category: apiAssistant.category,
    language_id: apiAssistant.language_id,
    stt_model_id: apiAssistant.stt_model_id,
    tts_model_id: apiAssistant.tts_model_id,
    llm_model_id: apiAssistant.llm_model_id,
    voice_id: apiAssistant.voice_id,
    prompt: apiAssistant.prompt,
    speech_speed: apiAssistant.speech_speed,
    pitch: apiAssistant.pitch,
    interruption_level: apiAssistant.interruption_level,
    cutoff_seconds: apiAssistant.cutoff_seconds,
    ideal_time_seconds: apiAssistant.ideal_time_seconds,
    call_end_text: apiAssistant.call_end_text,
    max_token: apiAssistant.max_token,
    temperature: apiAssistant.temperature,
    initial_message: apiAssistant.initial_message,
    call_recording: apiAssistant.call_recording,
    barge_in: apiAssistant.barge_in,
    voice_activity_detection: apiAssistant.voice_activity_detection,
    noise_suppression: apiAssistant.noise_suppression,
    function_calling: apiAssistant.function_calling,
    functions: apiAssistant.functions,
    max_call_duration: apiAssistant.max_call_duration,
    silence_timeout: apiAssistant.silence_timeout,
    is_transferable: apiAssistant.is_transferable,
    transfer_number: apiAssistant.transfer_number,
    filler_message: apiAssistant.filler_message,
    function_filler_message: apiAssistant.function_filler_message,
    language: apiAssistant.language,
    script_rule: apiAssistant.script_rule,
    opening_instruction: apiAssistant.opening_instruction,
    closing_instruction: apiAssistant.closing_instruction,
    timeout_message: apiAssistant.timeout_message,
    gemini_start_sensitivity: apiAssistant.gemini_start_sensitivity,
    gemini_end_sensitivity: apiAssistant.gemini_end_sensitivity,
    gemini_silence_duration_ms: apiAssistant.gemini_silence_duration_ms,
    gemini_prefix_padding_ms: apiAssistant.gemini_prefix_padding_ms,
    assistant_id: apiAssistant.assistant_id,
    training_status: apiAssistant.training_status,
    logo_file_url: apiAssistant.logo_file_url,
    logo_file_type: apiAssistant.logo_file_type,
    logo_file_size: apiAssistant.logo_file_size,
    is_active: apiAssistant.is_active,
    is_deleted: apiAssistant.is_deleted,
    deleted_until: apiAssistant.deleted_until,
    created_at: apiAssistant.created_at,
    updated_at: apiAssistant.updated_at,
    calls_today: apiAssistant.calls_today,
    avg_duration: apiAssistant.avg_duration,
    last_active: apiAssistant.last_active,
  };
}
