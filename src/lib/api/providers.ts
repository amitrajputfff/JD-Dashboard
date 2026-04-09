import { apiClient } from './client';
import { 
  Provider, 
  LLMModel, 
  TTSModel,
  STTModel,
  Voice,
  Language,
  ProvidersResponse, 
  LLMModelsResponse,
  TTSModelsResponse,
  STTModelsResponse,
  VoicesResponse,
  LanguagesResponse,
  ProviderFilters, 
  LLMModelFilters,
  TTSModelFilters,
  STTModelFilters,
  VoiceFilters
} from '@/types/provider';

// Utility function to get authentication token
const getAuthToken = async (): Promise<string> => {
  if (typeof window !== 'undefined') {
    const { authStorage } = await import('../auth-storage');
    return authStorage.getAccessToken() || '';
  }
  return '';
};

// Utility function to create authenticated fetch request
const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = await getAuthToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Handle 401 Unauthorized - session expired
  if (response.status === 401 && typeof window !== 'undefined') {
    const { authStorage } = await import('../auth-storage');
    const { toast } = await import('sonner');
    
    console.warn('401 Unauthorized - logging out user');
    authStorage.clear();
    
    toast.error('Session expired', {
      description: 'Your session has expired. Please log in again.',
      duration: 4000
    });
    
    window.location.href = '/login';
    throw new Error(`Unauthorized - session expired`);
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

export const providersApi = {
  // Get all providers with pagination and filters
  getProviders: async (params?: {
    skip?: number;
    limit?: number;
    service_type?: 'llm' | 'tts' | 'stt' | 'telephony' | 'phone_provider';
    organization_id?: string;
    is_active?: boolean;
  }): Promise<ProvidersResponse> => {
    // Get organization ID if not provided
    let orgId = params?.organization_id;
    if (!orgId) {
      try {
        if (typeof window !== 'undefined') {
          const { authStorage } = await import('../auth-storage');
          const user = authStorage.getUser();
          orgId = user?.organization_id || undefined;
        }
      } catch (error) {
        console.error('Failed to get organization ID:', error);
      }
    }
    
    if (!orgId) {
      console.warn('No organization mapped - returning empty providers list');
      return {
        providers: [],
        total: 0
      };
    }

    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.service_type) searchParams.append('service_type', params.service_type);
    searchParams.append('organization_id', orgId);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

    // Providers are statically configured (Gemini/Sarvam/Cartesia)
    return { providers: [], total: 0 };
  },

  // Get LLM providers specifically
  getLLMProviders: async (params?: {
    skip?: number;
    limit?: number;
    organization_id?: string;
    is_active?: boolean;
  }): Promise<ProvidersResponse> => {
    return providersApi.getProviders({
      ...params,
      service_type: 'llm'
    });
  },

  // Get TTS providers specifically
  getTTSProviders: async (params?: {
    skip?: number;
    limit?: number;
    organization_id?: string;
    is_active?: boolean;
  }): Promise<ProvidersResponse> => {
    return providersApi.getProviders({
      ...params,
      service_type: 'tts'
    });
  },

  // Get STT providers specifically
  getSTTProviders: async (params?: {
    skip?: number;
    limit?: number;
    organization_id?: string;
    is_active?: boolean;
  }): Promise<ProvidersResponse> => {
    return providersApi.getProviders({
      ...params,
      service_type: 'stt'
    });
  },

  // Get telephony providers specifically
  getTelephonyProviders: async (params?: {
    skip?: number;
    limit?: number;
    organization_id?: string;
    is_active?: boolean;
  }): Promise<ProvidersResponse> => {
    return providersApi.getProviders({
      ...params,
      service_type: 'telephony'
    });
  },

  // Get phone providers specifically
  getPhoneProviders: async (params?: {
    skip?: number;
    limit?: number;
    organization_id?: string;
    is_active?: boolean;
  }): Promise<ProvidersResponse> => {
    return providersApi.getProviders({
      ...params,
      service_type: 'phone_provider'
    });
  },

  // Get provider by ID
  getProvider: async (_id: number): Promise<Provider> => {
    throw new Error('Provider details not available');
  }
};

export const ttsModelsApi = {
  // Get TTS models with pagination and filters
  getTTSModels: async (params?: {
    skip?: number;
    limit?: number;
    provider_id?: number;
    is_active?: boolean;
  }): Promise<TTSModelsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.provider_id !== undefined) searchParams.append('provider_id', params.provider_id.toString());
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

    return { tts_models: [], total: 0 };
  },

  // Get TTS models by provider ID
  getTTSModelsByProvider: async (providerId: number, params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<TTSModelsResponse> => {
    return ttsModelsApi.getTTSModels({
      ...params,
      provider_id: providerId
    });
  },

  // Get TTS model by ID
  getTTSModel: async (_id: number): Promise<TTSModel> => {
    throw new Error('TTS model details not available');
  }
};

export const voicesApi = {
  // Get voices with pagination and filters
  getVoices: async (params?: {
    skip?: number;
    limit?: number;
    tts_model_id?: number;
    is_active?: boolean;
  }): Promise<VoicesResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.tts_model_id !== undefined) searchParams.append('tts_model_id', params.tts_model_id.toString());
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

    return { voices: [], total: 0 };
  },

  // Get voices by TTS model ID
  getVoicesByTTSModel: async (ttsModelId: number, params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<VoicesResponse> => {
    return voicesApi.getVoices({
      ...params,
      tts_model_id: ttsModelId
    });
  },

  // Get voice by ID
  getVoice: async (_id: number): Promise<Voice> => {
    throw new Error('Voice details not available');
  }
};

export const sttModelsApi = {
  // Get STT models with pagination and filters
  getSTTModels: async (params?: {
    skip?: number;
    limit?: number;
    provider_id?: number;
    is_active?: boolean;
  }): Promise<STTModelsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.provider_id !== undefined) searchParams.append('provider_id', params.provider_id.toString());
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

    return { stt_models: [], total: 0 };
  },

  // Get STT models by provider ID
  getSTTModelsByProvider: async (providerId: number, params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<STTModelsResponse> => {
    return sttModelsApi.getSTTModels({
      ...params,
      provider_id: providerId
    });
  },

  // Get STT model by ID
  getSTTModel: async (_id: number): Promise<STTModel> => {
    throw new Error('STT model details not available');
  }
};

export const languagesApi = {
  // Get all languages
  getLanguages: async (): Promise<LanguagesResponse> => {
    return { languages: [], total: 0 };
  }
};

export const llmModelsApi = {
  // Get LLM models with pagination and filters
  getLLMModels: async (params?: {
    skip?: number;
    limit?: number;
    provider_id?: number;
    is_active?: boolean;
  }): Promise<LLMModelsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.provider_id !== undefined) searchParams.append('provider_id', params.provider_id.toString());
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

    return { llm_models: [], total: 0 };
  },

  // Get LLM models by provider ID
  getLLMModelsByProvider: async (providerId: number, params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<LLMModelsResponse> => {
    return llmModelsApi.getLLMModels({
      ...params,
      provider_id: providerId
    });
  },

  // Get LLM model by ID
  getLLMModel: async (_id: number): Promise<LLMModel> => {
    throw new Error('LLM model details not available');
  }
};
