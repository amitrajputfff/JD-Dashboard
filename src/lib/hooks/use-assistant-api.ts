import { useState, useEffect, useCallback } from 'react';
import { assistantsApi, Provider, LLMModel, STTModel, TTSModel, Voice, Language } from '@/lib/api/assistants';
import { AssistantSchema } from '@/types/assistant';
import { z } from 'zod';

// Utility function to convert falsy values to null
const nullifyUndefined = <T>(value: T): T | null => {
  return value || null;
};

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
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await assistantsApi.getProviders(serviceType);
        // Filter only active providers and map to options
        const activeProviders = response.providers.filter(provider => provider.is_active === true);
        const providerOptions = activeProviders.map(provider => ({
          value: provider.id,
          label: provider.display_name,
          description: provider.description
        }));
        setProviders(providerOptions);
      } catch (err) {
        setError('Failed to fetch providers');
        console.error('Error fetching providers:', err);
        // Set default provider if API fails
        setProviders([{ value: 0, label: `Default ${serviceType.toUpperCase()} Provider`, description: 'Default provider' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [serviceType]);

  return { providers, loading, error };
}

// Hook for fetching LLM models
export function useLLMModels(providerId: number) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!providerId || providerId === 0) {
      setModels([{ value: 0, label: 'Default LLM Model', description: 'Default model' }]);
      return;
    }

    const fetchModels = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await assistantsApi.getLLMModels(providerId);
        const modelOptions = response.models.map(model => ({
          value: model.id,
          label: model.display_name || model.model_name,
          description: model.description
        }));
        setModels(modelOptions);
      } catch (err) {
        setError('Failed to fetch LLM models');
        console.error('Error fetching LLM models:', err);
        // Set default model if API fails
        setModels([{ value: 0, label: 'Default LLM Model', description: 'Default model' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [providerId]);

  return { models, loading, error };
}

// Hook for fetching STT models
export function useSTTModels(providerId: number) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!providerId || providerId === 0) {
      setModels([{ value: 0, label: 'Default STT Model', description: 'Default model' }]);
      return;
    }

    const fetchModels = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await assistantsApi.getSTTModels(providerId);
        const modelOptions = response.models.map(model => ({
          value: model.id,
          label: model.display_name || model.model_name,
          description: model.description
        }));
        setModels(modelOptions);
      } catch (err) {
        setError('Failed to fetch STT models');
        console.error('Error fetching STT models:', err);
        // Set default model if API fails
        setModels([{ value: 0, label: 'Default STT Model', description: 'Default model' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [providerId]);

  return { models, loading, error };
}

// Hook for fetching TTS models
export function useTTSModels(providerId: number) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!providerId || providerId === 0) {
      setModels([{ value: 0, label: 'Default TTS Model', description: 'Default model' }]);
      return;
    }

    const fetchModels = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await assistantsApi.getTTSModels(providerId);
        const modelOptions = response.models.map(model => ({
          value: model.id,
          label: model.display_name || model.model_name,
          description: model.description
        }));
        setModels(modelOptions);
      } catch (err) {
        setError('Failed to fetch TTS models');
        console.error('Error fetching TTS models:', err);
        // Set default model if API fails
        setModels([{ value: 0, label: 'Default TTS Model', description: 'Default model' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [providerId]);

  return { models, loading, error };
}

// Hook for fetching voices
export function useVoices(ttsModelId: number) {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ttsModelId || ttsModelId === 0) {
      setVoices([{ value: 0, label: 'Default Voice', description: 'Default voice' }]);
      return;
    }

    const fetchVoices = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await assistantsApi.getVoices(ttsModelId);
        const voiceOptions = response.voices.map(voice => ({
          value: voice.id,
          label: voice.voice_name, // Use voice_name instead of name
          description: voice.gender ? `${voice.gender} voice` : 'Voice'
        }));
        setVoices(voiceOptions);
      } catch (err) {
        setError('Failed to fetch voices');
        console.error('Error fetching voices:', err);
        setVoices([{ value: 0, label: 'Default Voice', description: 'Default voice' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, [ttsModelId]);

  return { voices, loading, error };
}

// Hook for fetching languages
export function useLanguages() {
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await assistantsApi.getLanguages();
        const languageOptions = response.languages.map(language => ({
          value: language.id,
          label: language.name,
          code: language.code
        }));
        setLanguages(languageOptions);
      } catch (err) {
        setError('Failed to fetch languages');
        console.error('Error fetching languages:', err);
        // Set default language if API fails
        setLanguages([{ value: 11, label: 'English', code: 'en' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  return { languages, loading, error };
}

// Hook for creating assistant
export function useCreateAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAssistant = useCallback(async (data: z.infer<typeof AssistantSchema> & { status: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get organization ID from current user
      const organizationId = await assistantsApi.getOrganizationId();
      if (!organizationId) {
        const errorMessage = 'No organization mapped. Please contact your administrator.';
        setError(errorMessage);
        setIsLoading(false);
        throw new Error(errorMessage);
      }

      const requestData = {
        name: data.name,
        description: data.description,
        organization_id: organizationId,
        prompt: data.prompt,
        llm_model_id: nullifyUndefined(data.llm_model_id),
        stt_model_id: nullifyUndefined(data.stt_model_id),
        tts_model_id: nullifyUndefined(data.tts_model_id),
        voice_id: nullifyUndefined(data.voice_id),
        language_id: data.language_id || 11, // Use form value instead of hardcoded
        tags: data.tags || [],
        category: data.category,
        status: data.status,
        speech_speed: data.speech_speed,
        pitch: data.pitch,
        max_token: data.max_token,
        temperature: data.temperature,
        memory_enabled: data.memory_enabled ?? false,
        max_memory_retrieval: data.max_memory_retrieval || 5,
        call_recording: data.call_recording,
        barge_in: data.barge_in,
        voice_activity_detection: data.voice_activity_detection,
        noise_suppression: data.noise_suppression,
        function_calling: data.function_calling,
        functions: data.functions && data.functions.length > 0 ? data.functions : null,
        max_call_duration: data.max_call_duration,
        silence_timeout: data.silence_timeout,
        // Missing fields that were not being sent
        cutoff_seconds: data.cutoff_seconds || 5,
        ideal_time_seconds: data.ideal_time_seconds || 30,
        initial_message: data.initial_message || 'Hello, I am a digital assistant. How can I help you today?',
        call_end_text: data.call_end_text || 'Thank you for calling. Have a great day!',
        filler_message: data.filler_message || [],
        function_filler_message: data.function_filler_message || [],
        is_transferable: data.is_transferable || false,
        transfer_number: data.transfer_number || null,
        interruption_level: data.interruption_level || 'Low',
        // Knowledge base fields
        knowledge_base_enabled: data.has_knowledge_base,
        knowledge_documents: data.documents_ids ? data.documents_ids.map(String) : [],
        knowledge_datasets: data.knowledge_datasets || [],
        knowledge_similarity_threshold: data.knowledge_similarity_threshold,
        knowledge_max_results: data.knowledge_max_results,
      };

      const response = await assistantsApi.createAssistant(requestData);
      
      return {
        success: true,
        data: response
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create assistant';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createAssistant,
    isLoading,
    error
  };
}
