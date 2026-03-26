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

    const response = await authenticatedFetch(`https://backend.liaplus.com/backend/api/providers?${searchParams.toString()}`);
    return response.json();
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
  getProvider: async (id: number): Promise<Provider> => {
    const response = await authenticatedFetch(`https://backend.liaplus.com/backend/api/providers/${id}`);
    return response.json();
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

    const response = await authenticatedFetch(`https://backend.liaplus.com/backend/api/tts-models?${searchParams.toString()}`);
    return response.json();
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
  getTTSModel: async (id: number): Promise<TTSModel> => {
    const response = await authenticatedFetch(`https://backend.liaplus.com/backend/api/tts-models/${id}`);
    return response.json();
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

    const response = await authenticatedFetch(`https://backend.liaplus.com/backend/api/voices?${searchParams.toString()}`);
    return response.json();
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
  getVoice: async (id: number): Promise<Voice> => {
    const response = await authenticatedFetch(`https://backend.liaplus.com/backend/api/voices/${id}`);
    return response.json();
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

    const response = await authenticatedFetch(`https://backend.liaplus.com/backend/api/stt-models?${searchParams.toString()}`);
    return response.json();
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
  getSTTModel: async (id: number): Promise<STTModel> => {
    const response = await authenticatedFetch(`https://backend.liaplus.com/backend/api/stt-models/${id}`);
    return response.json();
  }
};

export const languagesApi = {
  // Get all languages
  getLanguages: async (): Promise<LanguagesResponse> => {
    const response = await authenticatedFetch('https://backend.liaplus.com/backend/api/languages');
    return response.json();
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

    const response = await authenticatedFetch(`https://backend.liaplus.com/backend/api/llm-models?${searchParams.toString()}`);
    return response.json();
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
  getLLMModel: async (id: number): Promise<LLMModel> => {
    const response = await authenticatedFetch(`https://backend.liaplus.com/backend/api/llm-models/${id}`);
    return response.json();
  }
};
