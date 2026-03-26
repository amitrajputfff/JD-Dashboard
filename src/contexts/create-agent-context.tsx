'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useProviders, useLLMModels, useTTSModels, useSTTModels, useVoices, useLanguages } from '@/hooks/use-providers';

interface CreateAgentContextType {
  // LLM Data
  llmProviders: any[];
  llmProvidersLoading: boolean;
  llmProvidersError: string | null;
  llmModels: any[];
  llmModelsLoading: boolean;
  llmModelsError: string | null;
  refetchLLMModels: (providerId?: number) => void;

  // TTS Data
  ttsProviders: any[];
  ttsProvidersLoading: boolean;
  ttsProvidersError: string | null;
  ttsModels: any[];
  ttsModelsLoading: boolean;
  ttsModelsError: string | null;
  voices: any[];
  voicesLoading: boolean;
  voicesError: string | null;
  refetchTTSModels: (providerId?: number) => void;
  refetchVoices: (ttsModelId?: number) => void;

  // STT Data
  sttProviders: any[];
  sttProvidersLoading: boolean;
  sttProvidersError: string | null;
  sttModels: any[];
  sttModelsLoading: boolean;
  sttModelsError: string | null;
  languages: any[];
  languagesLoading: boolean;
  languagesError: string | null;
  refetchSTTModels: (providerId?: number) => void;

  // Combined loading states
  isLoading: boolean;
  hasError: boolean;
}

const CreateAgentContext = createContext<CreateAgentContextType | undefined>(undefined);

interface CreateAgentProviderProps {
  children: ReactNode;
  llmProviderId?: number;
  ttsProviderId?: number;
  ttsModelId?: number;
  sttProviderId?: number;
}

export function CreateAgentProvider({ 
  children, 
  llmProviderId, 
  ttsProviderId, 
  ttsModelId, 
  sttProviderId 
}: CreateAgentProviderProps) {
  // LLM Data - fetched once
  const { 
    providers: llmProvidersRaw, 
    loading: llmProvidersLoading, 
    error: llmProvidersError 
  } = useProviders('llm');

  const { 
    models: llmModelsRaw, 
    loading: llmModelsLoading, 
    error: llmModelsError,
    refetch: refetchLLMModels 
  } = useLLMModels(llmProviderId);

  // TTS Data - fetched once
  const { 
    providers: ttsProvidersRaw, 
    loading: ttsProvidersLoading, 
    error: ttsProvidersError 
  } = useProviders('tts');

  const { 
    models: ttsModelsRaw, 
    loading: ttsModelsLoading, 
    error: ttsModelsError,
    refetch: refetchTTSModels 
  } = useTTSModels(ttsProviderId);

  const { 
    voices: voicesRaw, 
    loading: voicesLoading, 
    error: voicesError,
    refetch: refetchVoices 
  } = useVoices(ttsModelId);

  // STT Data - fetched once
  const { 
    providers: sttProvidersRaw, 
    loading: sttProvidersLoading, 
    error: sttProvidersError 
  } = useProviders('stt');

  const { 
    models: sttModelsRaw, 
    loading: sttModelsLoading, 
    error: sttModelsError,
    refetch: refetchSTTModels 
  } = useSTTModels(sttProviderId);

  // Languages - fetched once
  const { 
    languages: languagesRaw, 
    loading: languagesLoading, 
    error: languagesError 
  } = useLanguages();

  // Format data for form components with safety checks
  const llmProviders = (llmProvidersRaw || []).map(provider => ({
    value: provider?.id || 0,
    label: provider?.display_name || 'Unknown Provider',
    description: provider?.description || ''
  }));

  const llmModels = (llmModelsRaw || []).map(model => ({
    value: model?.id || 0,
    label: model?.display_name || model?.model_name || 'Unknown Model',
    description: model?.description || ''
  }));

  const ttsProviders = (ttsProvidersRaw || []).map(provider => ({
    value: provider?.id || 0,
    label: provider?.display_name || 'Unknown Provider',
    description: provider?.description || ''
  }));

  const ttsModels = (ttsModelsRaw || []).map(model => ({
    value: model?.id || 0,
    label: model?.display_name || model?.model_name || 'Unknown Model',
    description: model?.description || ''
  }));

  const voices = (voicesRaw || []).map(voice => ({
    value: voice?.id || 0,
    label: voice?.display_name || voice?.voice_name || 'Unknown Voice',
    description: voice?.gender || ''
  }));

  const sttProviders = (sttProvidersRaw || []).map(provider => ({
    value: provider?.id || 0,
    label: provider?.display_name || 'Unknown Provider',
    description: provider?.description || ''
  }));

  const sttModels = (sttModelsRaw || []).map(model => ({
    value: model?.id || 0,
    label: model?.display_name || model?.model_name || 'Unknown Model',
    description: model?.description || ''
  }));

  const languages = (languagesRaw || []).map(language => ({
    value: language?.id || 0,
    label: language?.name || 'Unknown Language',
    code: language?.code || ''
  }));

  // Combined loading and error states
  const isLoading = llmProvidersLoading || ttsProvidersLoading || sttProvidersLoading || 
                   llmModelsLoading || ttsModelsLoading || sttModelsLoading || 
                   voicesLoading || languagesLoading;

  const hasError = !!(llmProvidersError || ttsProvidersError || sttProvidersError || 
                     llmModelsError || ttsModelsError || sttModelsError || 
                     voicesError || languagesError);

  const value: CreateAgentContextType = {
    // LLM Data
    llmProviders,
    llmProvidersLoading,
    llmProvidersError,
    llmModels,
    llmModelsLoading,
    llmModelsError,
    refetchLLMModels,

    // TTS Data
    ttsProviders,
    ttsProvidersLoading,
    ttsProvidersError,
    ttsModels,
    ttsModelsLoading,
    ttsModelsError,
    voices,
    voicesLoading,
    voicesError,
    refetchTTSModels,
    refetchVoices,

    // STT Data
    sttProviders,
    sttProvidersLoading,
    sttProvidersError,
    sttModels,
    sttModelsLoading,
    sttModelsError,
    languages,
    languagesLoading,
    languagesError,
    refetchSTTModels,

    // Combined states
    isLoading,
    hasError,
  };

  return (
    <CreateAgentContext.Provider value={value}>
      {children}
    </CreateAgentContext.Provider>
  );
}

export function useCreateAgentContext() {
  const context = useContext(CreateAgentContext);
  if (context === undefined) {
    throw new Error('useCreateAgentContext must be used within a CreateAgentProvider');
  }
  return context;
}
