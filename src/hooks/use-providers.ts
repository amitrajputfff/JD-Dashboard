import { useState, useCallback } from 'react';
import { Provider, LLMModel, TTSModel, STTModel, Voice, Language } from '@/types/provider';
import {
  MOCK_LLM_PROVIDERS,
  MOCK_TTS_PROVIDERS,
  MOCK_STT_PROVIDERS,
  MOCK_TELEPHONY_PROVIDERS,
  MOCK_LLM_MODELS,
  MOCK_TTS_MODELS,
  MOCK_STT_MODELS,
  MOCK_VOICES,
  MOCK_LANGUAGES,
} from '@/lib/mock-data/providers';

export const useProviders = (serviceType?: 'llm' | 'tts' | 'stt' | 'telephony' | 'phone_provider') => {
  const getProviders = (): Provider[] => {
    switch (serviceType) {
      case 'llm': return MOCK_LLM_PROVIDERS;
      case 'tts': return MOCK_TTS_PROVIDERS;
      case 'stt': return MOCK_STT_PROVIDERS;
      case 'telephony':
      case 'phone_provider': return MOCK_TELEPHONY_PROVIDERS;
      default: return [...MOCK_LLM_PROVIDERS, ...MOCK_TTS_PROVIDERS, ...MOCK_STT_PROVIDERS, ...MOCK_TELEPHONY_PROVIDERS];
    }
  };

  return {
    providers: getProviders(),
    loading: false,
    error: null,
    refetch: () => {},
  };
};

export const useLLMModels = (providerId?: number) => {
  const models = providerId ? MOCK_LLM_MODELS.filter(m => m.provider_id === providerId) : [];
  return { models, loading: false, error: null, refetch: () => {} };
};

export const useTTSModels = (providerId?: number) => {
  const models = providerId ? MOCK_TTS_MODELS.filter(m => m.provider_id === providerId) : [];
  return { models, loading: false, error: null, refetch: () => {} };
};

export const useSTTModels = (providerId?: number) => {
  const models = providerId ? MOCK_STT_MODELS.filter(m => m.provider_id === providerId) : [];
  return { models, loading: false, error: null, refetch: () => {} };
};

export const useLanguages = () => {
  return { languages: MOCK_LANGUAGES, loading: false, error: null, refetch: () => {} };
};

export const useVoices = (ttsModelId?: number) => {
  const voices = ttsModelId ? MOCK_VOICES.filter(v => v.tts_model_id === ttsModelId) : [];
  return { voices, loading: false, error: null, refetch: () => {} };
};

export const useProviderWithModels = (serviceType: 'llm' | 'tts' | 'stt' | 'telephony' | 'phone_provider') => {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedModel, setSelectedModel] = useState<LLMModel | TTSModel | STTModel | null>(null);

  const { providers } = useProviders(serviceType);
  const { models: llmModels } = useLLMModels(serviceType === 'llm' ? selectedProvider?.id : undefined);
  const { models: ttsModels } = useTTSModels(serviceType === 'tts' ? selectedProvider?.id : undefined);
  const { models: sttModels } = useSTTModels(serviceType === 'stt' ? selectedProvider?.id : undefined);

  const models = serviceType === 'llm' ? llmModels : serviceType === 'tts' ? ttsModels : serviceType === 'stt' ? sttModels : [];

  const handleProviderChange = useCallback((provider: Provider | null) => {
    setSelectedProvider(provider);
    setSelectedModel(null);
  }, []);

  const handleModelChange = useCallback((model: LLMModel | TTSModel | STTModel | null) => {
    setSelectedModel(model);
  }, []);

  return {
    providers, providersLoading: false, providersError: null, refetchProviders: () => {},
    models, modelsLoading: false, modelsError: null, refetchModels: () => {},
    selectedProvider, selectedModel,
    handleProviderChange, handleModelChange,
    loading: false, error: null,
  };
};

export const useSTTProviderWithModelsAndLanguages = () => {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedModel, setSelectedModel] = useState<STTModel | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  const { providers } = useProviders('stt');
  const { models } = useSTTModels(selectedProvider?.id);
  const { languages } = useLanguages();

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
    providers, providersLoading: false, providersError: null, refetchProviders: () => {},
    models, modelsLoading: false, modelsError: null, refetchModels: () => {},
    languages, languagesLoading: false, languagesError: null, refetchLanguages: () => {},
    selectedProvider, selectedModel, selectedLanguage,
    handleProviderChange, handleModelChange, handleLanguageChange,
    loading: false, error: null,
  };
};

export const useTTSProviderWithModelsAndVoices = () => {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedModel, setSelectedModel] = useState<TTSModel | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);

  const { providers } = useProviders('tts');
  const { models } = useTTSModels(selectedProvider?.id);
  const { voices } = useVoices(selectedModel?.id);

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
    providers, providersLoading: false, providersError: null, refetchProviders: () => {},
    models, modelsLoading: false, modelsError: null, refetchModels: () => {},
    voices, voicesLoading: false, voicesError: null, refetchVoices: () => {},
    selectedProvider, selectedModel, selectedVoice,
    handleProviderChange, handleModelChange, handleVoiceChange,
    loading: false, error: null,
  };
};
