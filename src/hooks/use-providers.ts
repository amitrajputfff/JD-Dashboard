import { useState, useEffect, useCallback } from 'react';
import { providersApi, llmModelsApi, ttsModelsApi, sttModelsApi, voicesApi, languagesApi } from '@/lib/api/providers';
import { Provider, LLMModel, TTSModel, STTModel, Voice, Language } from '@/types/provider';

export const useProviders = (serviceType?: 'llm' | 'tts' | 'stt' | 'telephony' | 'phone_provider', autoLoad: boolean = true) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async (params?: {
    skip?: number;
    limit?: number;
    organization_id?: string;
    is_active?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Default to only active providers unless explicitly specified
      const fetchParams = {
        is_active: true, // Default to active providers only
        ...params
      };
      
      let response;
      if (serviceType === 'llm') {
        response = await providersApi.getLLMProviders(fetchParams);
      } else if (serviceType === 'tts') {
        response = await providersApi.getTTSProviders(fetchParams);
      } else if (serviceType === 'stt') {
        response = await providersApi.getSTTProviders(fetchParams);
      } else if (serviceType === 'telephony') {
        response = await providersApi.getProviders({ ...fetchParams, service_type: 'telephony' });
      } else if (serviceType === 'phone_provider') {
        response = await providersApi.getProviders({ ...fetchParams, service_type: 'phone_provider' });
      } else {
        response = await providersApi.getProviders(fetchParams);
      }
      
      // Additional client-side filtering as backup (in case API doesn't filter properly)
      const activeProviders = response.providers.filter(provider => provider.is_active === true);
      setProviders(activeProviders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch providers');
      console.error('Error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  }, [serviceType]);

  useEffect(() => {
    if (autoLoad) {
      fetchProviders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceType, autoLoad]); // Intentionally not including fetchProviders to avoid unnecessary re-fetches

  return {
    providers,
    loading,
    error,
    refetch: fetchProviders
  };
};

export const useLLMModels = (providerId?: number) => {
  const [models, setModels] = useState<LLMModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }) => {
    if (!providerId) {
      setModels([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await llmModelsApi.getLLMModelsByProvider(providerId, params);
      setModels(response.llm_models);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch LLM models');
      console.error('Error fetching LLM models:', err);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    loading,
    error,
    refetch: fetchModels
  };
};

export const useTTSModels = (providerId?: number) => {
  const [models, setModels] = useState<TTSModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }) => {
    if (!providerId) {
      setModels([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await ttsModelsApi.getTTSModelsByProvider(providerId, params);
      setModels(response.tts_models);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch TTS models');
      console.error('Error fetching TTS models:', err);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    loading,
    error,
    refetch: fetchModels
  };
};

export const useSTTModels = (providerId?: number) => {
  const [models, setModels] = useState<STTModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }) => {
    if (!providerId) {
      setModels([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await sttModelsApi.getSTTModelsByProvider(providerId, params);
      setModels(response.stt_models);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch STT models');
      console.error('Error fetching STT models:', err);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    loading,
    error,
    refetch: fetchModels
  };
};

export const useLanguages = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLanguages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await languagesApi.getLanguages();
      setLanguages(response.languages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch languages');
      console.error('Error fetching languages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  return {
    languages,
    loading,
    error,
    refetch: fetchLanguages
  };
};

export const useVoices = (ttsModelId?: number) => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVoices = useCallback(async (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }) => {
    if (!ttsModelId) {
      setVoices([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await voicesApi.getVoicesByTTSModel(ttsModelId, params);
      setVoices(response.voices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch voices');
      console.error('Error fetching voices:', err);
    } finally {
      setLoading(false);
    }
  }, [ttsModelId]);

  useEffect(() => {
    fetchVoices({ limit: 1000 });
  }, [fetchVoices]);

  return {
    voices,
    loading,
    error,
    refetch: fetchVoices
  };
};

export const useProviderWithModels = (serviceType: 'llm' | 'tts' | 'stt' | 'telephony' | 'phone_provider') => {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedModel, setSelectedModel] = useState<LLMModel | TTSModel | STTModel | null>(null);
  
  const { providers, loading: providersLoading, error: providersError, refetch: refetchProviders } = useProviders(serviceType);
  const { models: llmModels, loading: llmModelsLoading, error: llmModelsError, refetch: refetchLLMModels } = useLLMModels(serviceType === 'llm' ? selectedProvider?.id : undefined);
  const { models: ttsModels, loading: ttsModelsLoading, error: ttsModelsError, refetch: refetchTTSModels } = useTTSModels(serviceType === 'tts' ? selectedProvider?.id : undefined);
  const { models: sttModels, loading: sttModelsLoading, error: sttModelsError, refetch: refetchSTTModels } = useSTTModels(serviceType === 'stt' ? selectedProvider?.id : undefined);

  // Get the appropriate models based on service type
  const models = serviceType === 'llm' ? llmModels : serviceType === 'tts' ? ttsModels : serviceType === 'stt' ? sttModels : [];
  const modelsLoading = serviceType === 'llm' ? llmModelsLoading : serviceType === 'tts' ? ttsModelsLoading : serviceType === 'stt' ? sttModelsLoading : false;
  const modelsError = serviceType === 'llm' ? llmModelsError : serviceType === 'tts' ? ttsModelsError : serviceType === 'stt' ? sttModelsError : null;

  // Reset selected model when provider changes
  useEffect(() => {
    setSelectedModel(null);
  }, [selectedProvider]);

  const handleProviderChange = useCallback((provider: Provider | null) => {
    setSelectedProvider(provider);
    setSelectedModel(null);
  }, []);

  const handleModelChange = useCallback((model: LLMModel | TTSModel | STTModel | null) => {
    setSelectedModel(model);
  }, []);

  const getRefetchModels = () => {
    switch (serviceType) {
      case 'llm': return refetchLLMModels;
      case 'tts': return refetchTTSModels;
      case 'stt': return refetchSTTModels;
      default: return () => {};
    }
  };

  return {
    // Providers
    providers,
    providersLoading,
    providersError,
    refetchProviders,
    
    // Models
    models,
    modelsLoading,
    modelsError,
    refetchModels: getRefetchModels(),
    
    // Selection
    selectedProvider,
    selectedModel,
    handleProviderChange,
    handleModelChange,
    
    // Combined loading state
    loading: providersLoading || modelsLoading,
    error: providersError || modelsError
  };
};

export const useSTTProviderWithModelsAndLanguages = () => {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedModel, setSelectedModel] = useState<STTModel | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  
  const { providers, loading: providersLoading, error: providersError, refetch: refetchProviders } = useProviders('stt');
  const { models, loading: modelsLoading, error: modelsError, refetch: refetchModels } = useSTTModels(selectedProvider?.id);
  const { languages, loading: languagesLoading, error: languagesError, refetch: refetchLanguages } = useLanguages();

  // Reset selections when dependencies change
  useEffect(() => {
    setSelectedModel(null);
    setSelectedLanguage(null);
  }, [selectedProvider]);

  const handleProviderChange = useCallback((provider: Provider | null) => {
    setSelectedProvider(provider);
    setSelectedModel(null);
    setSelectedLanguage(null);
  }, []);

  const handleModelChange = useCallback((model: STTModel | null) => {
    setSelectedModel(model);
  }, []);

  const handleLanguageChange = useCallback((language: Language | null) => {
    setSelectedLanguage(language);
  }, []);

  return {
    // Providers
    providers,
    providersLoading,
    providersError,
    refetchProviders,
    
    // Models
    models,
    modelsLoading,
    modelsError,
    refetchModels,
    
    // Languages
    languages,
    languagesLoading,
    languagesError,
    refetchLanguages,
    
    // Selection
    selectedProvider,
    selectedModel,
    selectedLanguage,
    handleProviderChange,
    handleModelChange,
    handleLanguageChange,
    
    // Combined loading state
    loading: providersLoading || modelsLoading || languagesLoading,
    error: providersError || modelsError || languagesError
  };
};

export const useTTSProviderWithModelsAndVoices = () => {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedModel, setSelectedModel] = useState<TTSModel | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  
  const { providers, loading: providersLoading, error: providersError, refetch: refetchProviders } = useProviders('tts');
  const { models, loading: modelsLoading, error: modelsError, refetch: refetchModels } = useTTSModels(selectedProvider?.id);
  const { voices, loading: voicesLoading, error: voicesError, refetch: refetchVoices } = useVoices(selectedModel?.id);

  // Reset selections when dependencies change
  useEffect(() => {
    setSelectedModel(null);
    setSelectedVoice(null);
  }, [selectedProvider]);

  useEffect(() => {
    setSelectedVoice(null);
  }, [selectedModel]);

  const handleProviderChange = useCallback((provider: Provider | null) => {
    setSelectedProvider(provider);
    setSelectedModel(null);
    setSelectedVoice(null);
  }, []);

  const handleModelChange = useCallback((model: TTSModel | null) => {
    setSelectedModel(model);
    setSelectedVoice(null);
  }, []);

  const handleVoiceChange = useCallback((voice: Voice | null) => {
    setSelectedVoice(voice);
  }, []);

  return {
    // Providers
    providers,
    providersLoading,
    providersError,
    refetchProviders,
    
    // Models
    models,
    modelsLoading,
    modelsError,
    refetchModels,
    
    // Voices
    voices,
    voicesLoading,
    voicesError,
    refetchVoices,
    
    // Selection
    selectedProvider,
    selectedModel,
    selectedVoice,
    handleProviderChange,
    handleModelChange,
    handleVoiceChange,
    
    // Combined loading state
    loading: providersLoading || modelsLoading || voicesLoading,
    error: providersError || modelsError || voicesError
  };
};
