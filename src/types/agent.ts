export interface Agent {
  // API response structure
  organization_id: string;
  name: string;
  tags: string[];
  category: string;
  status: 'Active' | 'Draft' | 'Deleted';
  language_id: number;
  stt_model_id: number | null;
  tts_model_id: number | null;
  llm_model_id: number | null;
  voice_id: number | null;
  prompt: string | null;
  speech_speed: string;
  pitch: string;
  interruption_level: string;
  cutoff_seconds: number;
  ideal_time_seconds: number;
  call_end_text: string | null;
  max_token: number;
  temperature: string;
  memory_enabled: boolean;
  max_memory_retrieval: number;
  initial_message: string;
  call_recording: boolean;
  barge_in: boolean;
  voice_activity_detection: boolean;
  noise_suppression: boolean;
  function_calling: boolean;
  functions: AgentFunction[];
  max_call_duration: number;
  silence_timeout: number;
  is_transferable: boolean;
  transfer_number: string | null;
  description: string;
  filler_message: string[];
  function_filler_message: string[];
  id: number;
  assistant_id: string;
  training_status: string;
  rag_processing_status?: string;
  rag_last_processed_at?: string | null;
  rag_processing_error?: string | null;
  has_knowledge_base?: boolean;
  documents_ids?: number[];
  logo_file_url: string | null;
  logo_file_type: string | null;
  logo_file_size: number | null;
  is_active: boolean;
  is_deleted: boolean;
  deleted_until: string | null;
  created_at: string;
  updated_at: string;
  calls_today: number;
  avg_duration: string;
  last_active: string | null;
  
  // Legacy fields for compatibility
  voiceModel?: VoiceModel;
  personality?: AgentPersonality;
  phoneNumbers?: PhoneNumberAssignment[];
  script?: AgentScript;
  knowledgeBase?: string[];
  settings?: AgentSettings;
  metrics?: AgentMetrics;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  createdBy?: string;
}

export interface VoiceModel {
  id: string;
  name: string;
  provider: 'openai' | 'elevenlabs' | 'azure' | 'google';
  language: string;
  gender: 'male' | 'female' | 'neutral';
  accent?: string;
  speed: number; // 0.5 to 2.0
  pitch: string; // -50% to 50%
}

export interface AgentPersonality {
  tone: 'professional' | 'friendly' | 'casual' | 'formal' | 'empathetic';
  style: 'conversational' | 'direct' | 'supportive' | 'sales' | 'informative';
  pace: 'slow' | 'normal' | 'fast';
  interruption_handling: 'polite' | 'assertive' | 'patient';
  small_talk: boolean;
}

export interface PhoneNumberAssignment {
  phoneNumber: string;
  assignedAt: string;
  isDefault: boolean;
  country: string;
  carrier?: string;
}

export interface AgentScript {
  id: string;
  name: string;
  greeting: string;
  fallbackResponses: string[];
  endingPhrases: string[];
  maxCallDuration: number; // in minutes
  transferConditions?: TransferCondition[];
}

export interface TransferCondition {
  trigger: string;
  destination: string;
  message: string;
}

export interface AgentFunction {
  url: string;
  name?: string;
  method?: string;
  schema?: Record<string, unknown>;
  headers?: Record<string, string>;
  body_format?: string;
  custom_body?: string;
  description?: string;
  query_params?: Record<string, string>;
  required?: string[];
  parameters?: Record<string, AgentFunctionParameter>;
}

export interface AgentFunctionParameter {
  type: string;
  description: string;
  enum?: string[];
}

export interface AgentSettings {
  maxConcurrentCalls: number;
  callRecording: boolean;
  transcription: boolean;
  sentimentAnalysis: boolean;
  realTimeAnalytics: boolean;
  allowInterruptions: boolean;
  voicemailDetection: boolean;
  timezone: string;
  workingHours: {
    enabled: boolean;
    schedule: DaySchedule[];
  };
}

export interface DaySchedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
}

export interface AgentMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  avgCallDuration: number; // in seconds
  avgResponseTime: number; // in milliseconds
  successRate: number; // percentage
  customerSatisfaction?: number; // 1-5 rating
  lastActive?: string;
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
  revenue?: number;
  costPerCall?: number;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  voiceModel: string;
  personality: {
    tone: string;
    style: string;
    pace: string;
  };
  script?: string;
}

export interface UpdateAgentRequest extends Partial<CreateAgentRequest> {
  status?: 'active' | 'inactive' | 'training';
  phoneNumbers?: string[];
  knowledgeBase?: string[];
}
