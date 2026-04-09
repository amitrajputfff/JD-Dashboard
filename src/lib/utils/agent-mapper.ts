import { Agent } from '@/types/agent';

/**
 * Maps the API response to the expected Agent format for UI components
 */
export const mapApiAgentToAgent = (apiAgent: any): Agent => {
  return {
    // Map API fields to component expected fields
    id: apiAgent.assistant_id || apiAgent.id?.toString(),
    name: apiAgent.name,
    description: apiAgent.description,
    status: mapApiStatusToStatus(apiAgent.status),
    tags: apiAgent.tags || [],
    
    // API fields (keep original structure)
    organization_id: apiAgent.organization_id,
    category: apiAgent.category,
    language_id: apiAgent.language_id,
    stt_model_id: apiAgent.stt_model_id,
    tts_model_id: apiAgent.tts_model_id,
    llm_model_id: apiAgent.llm_model_id,
    voice_id: apiAgent.voice_id,
    prompt: apiAgent.prompt,
    speech_speed: apiAgent.speech_speed,
    pitch: apiAgent.pitch,
    interruption_level: apiAgent.interruption_level,
    cutoff_seconds: apiAgent.cutoff_seconds,
    ideal_time_seconds: apiAgent.ideal_time_seconds,
    call_end_text: apiAgent.call_end_text,
    max_token: apiAgent.max_token,
    temperature: apiAgent.temperature,
    initial_message: apiAgent.initial_message,
    call_recording: apiAgent.call_recording,
    barge_in: apiAgent.barge_in,
    voice_activity_detection: apiAgent.voice_activity_detection,
    noise_suppression: apiAgent.noise_suppression,
    function_calling: apiAgent.function_calling,
    functions: apiAgent.functions || [],
    max_call_duration: apiAgent.max_call_duration,
    silence_timeout: apiAgent.silence_timeout,
    is_transferable: apiAgent.is_transferable,
    transfer_number: apiAgent.transfer_number,
    filler_message: apiAgent.filler_message || [],
    function_filler_message: apiAgent.function_filler_message || [],
    assistant_id: apiAgent.assistant_id,
    training_status: apiAgent.training_status,
    logo_file_url: apiAgent.logo_file_url,
    logo_file_type: apiAgent.logo_file_type,
    logo_file_size: apiAgent.logo_file_size,
    is_active: apiAgent.is_active,
    is_deleted: apiAgent.is_deleted,
    deleted_until: apiAgent.deleted_until,
    created_at: apiAgent.created_at,
    updated_at: apiAgent.updated_at,
    calls_today: apiAgent.calls_today,
    avg_duration: apiAgent.avg_duration,
    last_active: parseLastActive(apiAgent.last_active),
    
    // Legacy fields for compatibility with existing components
    createdAt: apiAgent.created_at,
    updatedAt: apiAgent.updated_at,
    deletedAt: apiAgent.deleted_until,
    createdBy: 'system', // Default value since not provided by API
    
    // Mock metrics for compatibility
    metrics: {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      avgCallDuration: parseAvgDuration(apiAgent.avg_duration),
      avgResponseTime: 0,
      successRate: 0,
      customerSatisfaction: undefined,
      lastActive: parseLastActive(apiAgent.last_active),
      callsToday: apiAgent.calls_today,
      callsThisWeek: 0,
      callsThisMonth: 0,
      revenue: 0,
      costPerCall: 0,
    },
    
    // Mock settings for compatibility
    settings: {
      maxConcurrentCalls: 1,
      callRecording: apiAgent.call_recording,
      transcription: true,
      sentimentAnalysis: false,
      realTimeAnalytics: false,
      allowInterruptions: apiAgent.barge_in,
      voicemailDetection: false,
      timezone: 'UTC',
      workingHours: {
        enabled: false,
        schedule: [],
      },
    },
    
    // Mock data for compatibility
    phoneNumbers: [],
    voiceModel: {
      id: apiAgent.voice_id?.toString() || '1',
      name: 'Default Voice',
      provider: 'elevenlabs',
      language: 'en',
      gender: 'neutral',
      speed: parseFloat(apiAgent.speech_speed) || 1.0,
      pitch: parseFloat((apiAgent.pitch || '0').replace('%', '')) || 0,
    },
    
    personality: {
      tone: 'professional',
      style: 'conversational',
      pace: 'normal',
      interruption_handling: 'polite',
      small_talk: false,
    },
  };
};

/**
 * Maps API status to component expected status
 */
const mapApiStatusToStatus = (apiStatus: string): 'active' | 'draft' | 'deleted' => {
  switch (apiStatus?.toLowerCase()) {
    case 'active':
      return 'active';
    case 'draft':
      return 'draft';
    case 'deleted':
      return 'deleted';
    default:
      return 'draft';
  }
};

/**
 * Parses avg_duration string (e.g., "0:00") to seconds
 */
const parseAvgDuration = (avgDuration: string): number => {
  if (!avgDuration || avgDuration === "0:00") return 0;
  
  const parts = avgDuration.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  
  return 0;
};

/**
 * Parses last_active field from API response
 * Handles "Never" string and converts valid dates to proper format
 */
const parseLastActive = (lastActive: string | null | undefined): string | null => {
  // Handle null/undefined
  if (!lastActive) return null;
  
  // Handle "Never" string from API
  if (lastActive === "Never" || lastActive.toLowerCase() === "never") {
    return null; // Return null so dateUtils shows "Never" fallback
  }
  
  // Try to parse as a valid date
  try {
    const date = new Date(lastActive);
    if (!isNaN(date.getTime())) {
      return lastActive; // Return original string if it's a valid date
    }
  } catch {
    // If parsing fails, treat as null
  }
  
  return null; // Return null for any invalid date format
};
