import { useState, useCallback } from 'react';
import {
  MOCK_LLM_PROVIDERS,
  MOCK_STT_PROVIDERS,
  MOCK_TTS_PROVIDERS,
  MOCK_LLM_MODELS,
  MOCK_STT_MODELS,
  MOCK_TTS_MODELS,
  MOCK_VOICES,
  MOCK_LANGUAGES,
} from '@/lib/mock-data/providers';
import { AssistantSchema } from '@/types/assistant';
import { z } from 'zod';

export interface ModelOption {
  value: number;
  label: string;
  description?: string;
}

export interface ProviderOption {
  value: number;
  label: string;
  description?: string;
}

export interface VoiceOption {
  value: number;
  label: string;
  description?: string;
}

export interface LanguageOption {
  value: number;
  label: string;
  code: string;
}

// Hook for fetching providers
export function useProviders(serviceType: 'llm' | 'stt' | 'tts') {
  const providerMap = {
    llm: MOCK_LLM_PROVIDERS,
    stt: MOCK_STT_PROVIDERS,
    tts: MOCK_TTS_PROVIDERS,
  };

  const providers: ProviderOption[] = (providerMap[serviceType] || [])
    .filter(p => p.is_active)
    .map(p => ({
      value: p.id,
      label: p.display_name,
      description: p.description ?? undefined,
    }));

  return { providers, loading: false, error: null };
}

// Hook for fetching LLM models
export function useLLMModels(providerId: number) {
  if (!providerId || providerId === 0) {
    return {
      models: [{ value: 0, label: 'Default LLM Model', description: 'Default model' }],
      loading: false,
      error: null,
    };
  }

  const models: ModelOption[] = MOCK_LLM_MODELS
    .filter(m => m.provider_id === providerId)
    .map(m => ({
      value: m.id,
      label: m.display_name || m.model_name,
      description: undefined,
    }));

  return { models, loading: false, error: null };
}

// Hook for fetching STT models
export function useSTTModels(providerId: number) {
  if (!providerId || providerId === 0) {
    return {
      models: [{ value: 0, label: 'Default STT Model', description: 'Default model' }],
      loading: false,
      error: null,
    };
  }

  const models: ModelOption[] = MOCK_STT_MODELS
    .filter(m => m.provider_id === providerId)
    .map(m => ({
      value: m.id,
      label: m.display_name || m.model_name,
      description: m.description ?? undefined,
    }));

  return { models, loading: false, error: null };
}

// Hook for fetching TTS models
export function useTTSModels(providerId: number) {
  if (!providerId || providerId === 0) {
    return {
      models: [{ value: 0, label: 'Default TTS Model', description: 'Default model' }],
      loading: false,
      error: null,
    };
  }

  const models: ModelOption[] = MOCK_TTS_MODELS
    .filter(m => m.provider_id === providerId)
    .map(m => ({
      value: m.id,
      label: m.display_name || m.model_name,
      description: m.description ?? undefined,
    }));

  return { models, loading: false, error: null };
}

// Hook for fetching voices
export function useVoices(ttsModelId: number) {
  if (!ttsModelId || ttsModelId === 0) {
    return {
      voices: [{ value: 0, label: 'Default Voice', description: 'Default voice' }],
      loading: false,
      error: null,
    };
  }

  const voices: VoiceOption[] = MOCK_VOICES
    .filter(v => v.tts_model_id === ttsModelId)
    .map(v => ({
      value: v.id,
      label: v.voice_name,
      description: v.gender ? `${v.gender} voice` : 'Voice',
    }));

  return { voices, loading: false, error: null };
}

// Hook for fetching languages
export function useLanguages() {
  const languages: LanguageOption[] = MOCK_LANGUAGES.map(l => ({
    value: l.id,
    label: l.name,
    code: l.code,
  }));

  return { languages, loading: false, error: null };
}

// Hook for creating assistant
export function useCreateAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAssistant = useCallback(async (data: z.infer<typeof AssistantSchema> & { status: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock creation - return a simulated response
      const mockResponse = {
        id: Math.floor(Math.random() * 10000),
        assistant_id: `asst-new-${Date.now()}`,
        organization_id: 'org-demo-123',
        name: data.name,
        description: data.description,
        status: data.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return {
        success: true,
        data: mockResponse,
      };
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error ? err.message : null) || 'Failed to create assistant';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createAssistant,
    isLoading,
    error,
  };
}
