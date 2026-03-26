import { AgentTemplateResponse, TemplateConfig } from '@/lib/api/templates';
import { llmModelsApi, ttsModelsApi, sttModelsApi } from '@/lib/api/providers';

/**
 * Convert API template data to form default values
 */
export function templateToFormDefaults(template: AgentTemplateResponse) {
  const config = template.template_config;
  
  return {
    // Basic Info
    name: config.name,
    description: config.description,
    category: config.category,
    tags: template.tags || [],
    
    // LLM Configuration
    llm_provider_id: undefined, // Will be fetched based on llm_model_id
    llm_model_id: config.llm_model_id,
    prompt: config.prompt,
    temperature: config.temperature,
    max_token: config.max_token,
    memory_enabled: config.memory_enabled ?? false,
    max_memory_retrieval: config.max_memory_retrieval || 5,
    
    // TTS Configuration
    tts_provider_id: undefined, // Will be fetched based on tts_model_id
    tts_model_id: config.tts_model_id,
    voice_id: config.voice_id,
    speech_speed: config.speech_speed,
    pitch: config.pitch,
    
    // STT Configuration
    stt_provider_id: undefined, // Will be fetched based on stt_model_id
    stt_model_id: config.stt_model_id,
    language_id: config.language_id,
    
    // Advanced Settings
    call_recording: config.call_recording,
    voice_activity_detection: config.voice_activity_detection,
    barge_in: config.barge_in,
    noise_suppression: config.noise_suppression,
    function_calling: config.function_calling,
    functions: config.functions || [],
    function_url: '',
    http_method: 'POST' as const,
    body_format: 'json' as const,
    headers: {},
    query_params: {},
    custom_body: '',
    max_call_duration: config.max_call_duration,
    silence_timeout: config.silence_timeout,
    cutoff_seconds: config.cutoff_seconds,
    ideal_time_seconds: config.ideal_time_seconds,
    is_transferable: false,
    transfer_number: '',
    transfer_conditions: '',
    interruption_level: config.interruption_level,
    initial_message: config.initial_message,
    call_end_text: config.call_end_text,
    filler_message: config.filler_message || [],
    function_filler_message: config.function_filler_message || [],
    
    // Status
    status: config.status,
  };
}

/**
 * Fetch provider IDs for template model IDs
 */
export async function fetchTemplateProviderIds(template: AgentTemplateResponse) {
  const config = template.template_config;
  const providerIds: {
    llm_provider_id?: number;
    tts_provider_id?: number;
    stt_provider_id?: number;
  } = {};

  try {
    // Fetch LLM model to get provider ID
    if (config.llm_model_id) {
      const llmModel = await llmModelsApi.getLLMModel(config.llm_model_id);
      if (llmModel.provider_id) {
        providerIds.llm_provider_id = llmModel.provider_id;
      }
    }
  } catch (error) {
    console.error('Error fetching LLM model provider:', error);
  }

  try {
    // Fetch TTS model to get provider ID
    if (config.tts_model_id) {
      const ttsModel = await ttsModelsApi.getTTSModel(config.tts_model_id);
      if (ttsModel.provider_id) {
        providerIds.tts_provider_id = ttsModel.provider_id;
      }
    }
  } catch (error) {
    console.error('Error fetching TTS model provider:', error);
  }

  try {
    // Fetch STT model to get provider ID
    if (config.stt_model_id) {
      const sttModel = await sttModelsApi.getSTTModel(config.stt_model_id);
      if (sttModel.provider_id) {
        providerIds.stt_provider_id = sttModel.provider_id;
      }
    }
  } catch (error) {
    console.error('Error fetching STT model provider:', error);
  }

  return providerIds;
}
