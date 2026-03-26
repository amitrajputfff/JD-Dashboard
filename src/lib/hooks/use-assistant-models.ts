import { useState, useEffect } from 'react';

export interface ModelOption {
  value: string;
  label: string;
  description?: string;
}

const MODEL_OPTIONS = {
  'Azure OpenAI': [
    { value: 'gpt-4', label: 'GPT-4', description: 'Most capable model' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Fast and efficient' },
    { value: 'gpt-35-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
    { value: 'gpt-4o', label: 'GPT-4o', description: 'Optimized for conversations' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Lightweight version' },
  ],
  'OpenAI': [
    { value: 'gpt-4', label: 'GPT-4', description: 'Most capable model' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Fast and efficient' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
    { value: 'gpt-4o', label: 'GPT-4o', description: 'Optimized for conversations' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Lightweight version' },
  ],
  'Local via Pipecat': [
    { value: 'llama-3.1-70b', label: 'Llama 3.1 70B', description: 'Large local model' },
    { value: 'llama-3.1-8b', label: 'Llama 3.1 8B', description: 'Efficient local model' },
    { value: 'mistral-7b', label: 'Mistral 7B', description: 'Fast local model' },
    { value: 'codellama-34b', label: 'CodeLlama 34B', description: 'Code-focused model' },
  ],
} as const;

const TTS_VOICES = [
  { value: 'en-US-AriaNeural', label: 'Aria (Female, US)', description: 'Natural and expressive' },
  { value: 'en-US-GuyNeural', label: 'Guy (Male, US)', description: 'Professional and clear' },
  { value: 'en-US-JennyNeural', label: 'Jenny (Female, US)', description: 'Warm and friendly' },
  { value: 'en-US-DavisNeural', label: 'Davis (Male, US)', description: 'Deep and authoritative' },
  { value: 'en-GB-SoniaNeural', label: 'Sonia (Female, UK)', description: 'British accent' },
  { value: 'en-AU-NatashaNeural', label: 'Natasha (Female, AU)', description: 'Australian accent' },
  { value: 'es-ES-ElviraNeural', label: 'Elvira (Female, ES)', description: 'Spanish accent' },
  { value: 'fr-FR-DeniseNeural', label: 'Denise (Female, FR)', description: 'French accent' },
];

const STT_MODELS = [
  { value: 'whisper-1', label: 'Whisper v1', description: 'High accuracy speech recognition' },
  { value: 'nova-2', label: 'Nova v2', description: 'Fast real-time transcription' },
  { value: 'enhanced', label: 'Enhanced', description: 'Optimized for telephony' },
];

const REGIONS = [
  { value: 'eastus', label: 'East US', description: 'Virginia, USA' },
  { value: 'westus', label: 'West US', description: 'California, USA' },
  { value: 'eastus2', label: 'East US 2', description: 'Virginia, USA' },
  { value: 'westeurope', label: 'West Europe', description: 'Netherlands' },
  { value: 'southeastasia', label: 'Southeast Asia', description: 'Singapore' },
  { value: 'japaneast', label: 'Japan East', description: 'Tokyo, Japan' },
  { value: 'australiaeast', label: 'Australia East', description: 'Sydney, Australia' },
  { value: 'canadacentral', label: 'Canada Central', description: 'Toronto, Canada' },
];

export function useAssistantModels(provider: string) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      const providerModels = MODEL_OPTIONS[provider as keyof typeof MODEL_OPTIONS] || [];
      setModels([...providerModels]);
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [provider]);

  return { models, loading };
}

export function useTTSVoices() {
  return { voices: TTS_VOICES, loading: false };
}

export function useSTTModels() {
  return { models: STT_MODELS, loading: false };
}

export function useRegions() {
  return { regions: REGIONS, loading: false };
}

export async function saveAssistant(): Promise<{ success: boolean; id?: string; error?: string }> {
  // Mock save function with 500ms delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate occasional failures (10% chance)
      if (Math.random() < 0.1) {
        resolve({ 
          success: false, 
          error: 'Failed to save assistant. Please check your network connection and try again.' 
        });
      } else {
        resolve({ 
          success: true, 
          id: `asst_${Math.random().toString(36).substr(2, 9)}` 
        });
      }
    }, 500);
  });
}

export const USERS_LIST = [
  { value: 'current-user', label: 'You', description: 'Current user' },
  { value: 'user-1', label: 'Alice Johnson', description: 'Product Manager' },
  { value: 'user-2', label: 'Bob Smith', description: 'Engineering Lead' },
  { value: 'user-3', label: 'Carol Davis', description: 'Customer Success' },
  { value: 'user-4', label: 'David Wilson', description: 'Sales Director' },
];

export const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Turkish', label: 'Turkish' },
  { value: 'Dutch', label: 'Dutch' },
  { value: 'Swedish', label: 'Swedish' },
  { value: 'Norwegian', label: 'Norwegian' },
  { value: 'Danish', label: 'Danish' },
];

export const LOCALES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'en-AU', label: 'English (Australia)' },
  { value: 'en-CA', label: 'English (Canada)' },
  { value: 'es-ES', label: 'Spanish (Spain)' },
  { value: 'es-MX', label: 'Spanish (Mexico)' },
  { value: 'fr-FR', label: 'French (France)' },
  { value: 'fr-CA', label: 'French (Canada)' },
  { value: 'de-DE', label: 'German (Germany)' },
  { value: 'it-IT', label: 'Italian (Italy)' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'pt-PT', label: 'Portuguese (Portugal)' },
  { value: 'ru-RU', label: 'Russian (Russia)' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'zh-TW', label: 'Chinese (Traditional)' },
  { value: 'ja-JP', label: 'Japanese (Japan)' },
  { value: 'ko-KR', label: 'Korean (South Korea)' },
  { value: 'ar-SA', label: 'Arabic (Saudi Arabia)' },
  { value: 'hi-IN', label: 'Hindi (India)' },
  { value: 'tr-TR', label: 'Turkish (Turkey)' },
];
