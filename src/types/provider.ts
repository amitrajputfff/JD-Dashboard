export interface Provider {
  id: number;
  name: string;
  display_name: string;
  service_type: 'llm' | 'tts' | 'stt' | 'telephony' | 'phone_provider';
  description: string | null;
  website: string | null;
  region: string;
  metadata_json: any | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LLMModel {
  id: number;
  provider_id: number;
  model_name: string;
  display_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  provider: Provider;
}

export interface TTSModel {
  id: number;
  provider_id: number;
  model_name: string;
  display_name?: string;
  description: string;
  supported_languages: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  provider: Provider;
}

export interface STTModel {
  id: number;
  provider_id: number;
  model_name: string;
  display_name?: string;
  description: string;
  supported_languages: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  provider: Provider;
}

export interface Voice {
  id: number;
  voice_name: string;
  display_name: string;
  description: string;
  gender: string;
  tts_model_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tts_model?: {
    provider_id: number;
    model_name: string;
    display_name?: string;
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

export interface ProvidersResponse {
  providers: Provider[];
  total: number;
  skip: number;
  limit: number;
}

export interface LLMModelsResponse {
  llm_models: LLMModel[];
  total: number;
  skip: number;
  limit: number;
}

export interface TTSModelsResponse {
  tts_models: TTSModel[];
  total: number;
  skip: number;
  limit: number;
}

export interface STTModelsResponse {
  stt_models: STTModel[];
  total: number;
  skip: number;
  limit: number;
}

export interface VoicesResponse {
  voices: Voice[];
  total: number;
  skip: number;
  limit: number;
}

export interface LanguagesResponse {
  languages: Language[];
  total: number;
}

export interface ProviderFilters {
  service_type?: 'llm' | 'tts' | 'stt' | 'telephony' | 'phone_provider';
  organization_id?: string;
  is_active?: boolean;
}

export interface LLMModelFilters {
  provider_id?: number;
  is_active?: boolean;
}

export interface TTSModelFilters {
  provider_id?: number;
  is_active?: boolean;
}

export interface STTModelFilters {
  provider_id?: number;
  is_active?: boolean;
}

export interface VoiceFilters {
  tts_model_id?: number;
  is_active?: boolean;
}
