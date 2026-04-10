import { z } from 'zod';

export const AssistantSchema = z.object({
  // 1) Basic Information
  name: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name must be at most 80 characters'),
  description: z.string().max(280, 'Description must be at most 280 characters').optional(),
  category: z.string().optional().default('Customer Service'),
  tags: z.array(z.string()).optional().default([]),

  // 2) LLM Configuration
  llm_provider_id: z.number().optional().default(1),
  llm_model_id: z.number().optional().default(1),
  prompt: z.string().min(10, 'System prompt must be at least 10 characters').optional().default('You are a helpful AI assistant.'),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  max_token: z.number().min(50).max(32000).optional().default(250),
  memory_enabled: z.boolean().optional().default(false),
  max_memory_retrieval: z.number().min(1).max(10).optional().default(5),

  // 3) TTS Configuration
  tts_provider_id: z.number().optional().default(1),
  tts_model_id: z.number().optional().default(1),
  voice_id: z.number().optional().default(1),
  speech_speed: z.number().min(0.5).max(2.0).optional().default(1.0),
  pitch: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'number') {
      return `${val}%`;
    }
    return val;
  }).optional().default('0%'),
  interruption_level: z.string().optional().default('Low'),

  // 4) STT Configuration
  stt_provider_id: z.number().optional().default(1),
  stt_model_id: z.number().optional().default(1),
  language_id: z.number().optional().default(11),

  // 5) Knowledge Base Configuration
  has_knowledge_base: z.boolean().optional().default(false),
  documents_ids: z.array(z.number()).optional().nullable().default(null), // Array of document IDs

  // 6) Advanced Settings
  call_recording: z.boolean().optional().default(true),
  voice_activity_detection: z.boolean().optional().default(true),
  barge_in: z.boolean().optional().default(true),
  noise_suppression: z.boolean().optional().default(true),
  function_calling: z.boolean().optional().default(false),
  functions: z.array(z.any()).optional().default([]),
  max_call_duration: z.number().min(1).max(3600).optional().default(1800),
  silence_timeout: z.number().min(1).max(60).optional().default(15),
  cutoff_seconds: z.number().min(1).max(30).optional().default(5),
  ideal_time_seconds: z.number().min(1).max(300).optional().default(30),
  is_transferable: z.boolean().optional().default(false),
  transfer_number: z.string().optional().default(''),

  // Gemini VAD (Voice Activity Detection) Settings
  gemini_start_sensitivity: z.enum(['START_SENSITIVITY_LOW', 'START_SENSITIVITY_MEDIUM', 'START_SENSITIVITY_HIGH']).optional().default('START_SENSITIVITY_LOW'),
  gemini_end_sensitivity: z.enum(['END_SENSITIVITY_LOW', 'END_SENSITIVITY_MEDIUM', 'END_SENSITIVITY_HIGH']).optional().default('END_SENSITIVITY_HIGH'),
  gemini_silence_duration_ms: z.number().min(200).max(3000).optional().default(800),
  gemini_prefix_padding_ms: z.number().min(0).max(500).optional().default(100),

  // 8) Prompt Config
  language: z.string().optional().default('hindi'),
  script_rule: z.string().optional().default(''),
  opening_instruction: z.string().optional().default(''),
  closing_instruction: z.string().optional().default(''),
  timeout_message: z.string().optional().default(''),

  // 7) Call Messages
  initial_message: z.string().optional().default('Hello, I am a digital assistant. How can I help you today?'),
  call_end_text: z.string().optional().default('Thank you for calling. Have a great day!'),
  filler_message: z.array(z.string()).optional().default([]),
  function_filler_message: z.array(z.string()).optional().default([]),
});

export type Assistant = z.infer<typeof AssistantSchema>;

// API Response types for assistant details
export interface AssistantDetails {
  organization_id: string;
  name: string;
  tags: string[];
  category: string;
  status: string;
  language_id: number;
  stt_model_id: number;
  tts_model_id: number;
  llm_model_id: number;
  voice_id: number;
  prompt: string;
  speech_speed: number;
  pitch: string;
  interruption_level: string;
  cutoff_seconds: number;
  ideal_time_seconds: number;
  call_end_text: string;
  max_token: number;
  temperature: number;
  memory_enabled: boolean;
  max_memory_retrieval: number;
  initial_message: string;
  call_recording: boolean;
  barge_in: boolean;
  voice_activity_detection: boolean;
  noise_suppression: boolean;
  function_calling: boolean;
  functions: AssistantFunction[];
  max_call_duration: number;
  silence_timeout: number;
  is_transferable: boolean;
  transfer_number: string | null;
  description: string;
  filler_message: string[];
  function_filler_message: string[];
  has_knowledge_base: boolean;
  documents_ids: number[] | null;
  // Prompt Config
  language: string;
  script_rule: string;
  opening_instruction: string;
  closing_instruction: string;
  timeout_message: string;
  // Gemini VAD settings
  gemini_start_sensitivity: string;
  gemini_end_sensitivity: string;
  gemini_silence_duration_ms: number;
  gemini_prefix_padding_ms: number;
  id: number;
  assistant_id: string;
  training_status: string;
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
  last_active: string;
}

export interface AssistantFunction {
  url: string;
  name: string;
  method: string;
  schema: Record<string, any>;
  headers: Record<string, any>;
  body_format: string;
  custom_body: string;
  description: string;
  query_params: Record<string, any>;
}

export interface FunctionConfig {
  id: string;
  name: string;
  description: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  query_params: Record<string, string>;
  body_format: string;
  custom_body: string;
  schema: Record<string, any>;
}

export interface FunctionValidationResponse {
  function_name: string;
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface UpdateAssistantRequest {
  name: string;
  description: string;
  tags: string[];
  speech_speed: number;
  pitch: string;
  call_recording: boolean;
  voice_activity_detection: boolean;
  barge_in: boolean;
  noise_suppression: boolean;
  max_call_duration: number;
  silence_timeout: number;
  cutoff_seconds: number;
  ideal_time_seconds: number;
  is_transferable: boolean;
  transfer_number: string | null;
  initial_message: string;
  call_end_text: string;
  filler_message: string[];
  function_filler_message: string[];
  function_calling: boolean;
  functions: AssistantFunction[];
  llm_model_id: number;
  prompt: string;
  temperature: number;
  max_token: number;
  memory_enabled: boolean;
  max_memory_retrieval: number;
  voice_id: number;
  tts_model_id: number;
  stt_model_id: number;
  language_id: number;
  status: string;
  has_knowledge_base: boolean;
  documents_ids: number[] | null;
  // Prompt Config
  language?: string;
  script_rule?: string;
  opening_instruction?: string;
  closing_instruction?: string;
  timeout_message?: string;
  // Gemini VAD
  gemini_start_sensitivity?: string;
  gemini_end_sensitivity?: string;
  gemini_silence_duration_ms?: number;
  gemini_prefix_padding_ms?: number;
}

// Helper types for form sections
export type AssistantFormSection = 
  | 'identity'
  | 'voice'
  | 'llm'
  | 'stt-tts'
  | 'knowledge'
  | 'orchestration'
  | 'routing'
  | 'compliance'
  | 'rbac'
  | 'observability'
  | 'webhooks'
  | 'testing';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FormSectionProps {
  control: any;
  watch: any;
  setValue: any;
  errors: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
