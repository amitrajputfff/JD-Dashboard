export interface Call {
  id: string;
  agentId: string;
  agentName: string;
  phoneNumber: string;
  contactName?: string;
  contactEmail?: string;
  status: CallStatus;
  direction: 'inbound' | 'outbound';
  duration: number; // in seconds
  recordingUrl?: string;
  transcript?: CallTranscript;
  summary?: CallSummary;
  sentiment?: SentimentAnalysis;
  outcome: CallOutcome;
  quality: CallQuality;
  metadata: CallMetadata;
  createdAt: string;
  updatedAt: string;
}

export type CallStatus = 
  | 'queued' 
  | 'ringing' 
  | 'in-progress' 
  | 'completed' 
  | 'failed' 
  | 'busy' 
  | 'no-answer' 
  | 'voicemail' 
  | 'cancelled';

export type CallOutcome = 
  | 'successful' 
  | 'unsuccessful' 
  | 'follow-up-required' 
  | 'transferred' 
  | 'voicemail-left' 
  | 'hung-up';

export interface CallTranscript {
  id: string;
  text: string;
  confidence: number; // 0-1
  language: string;
  speakers: SpeakerSegment[];
  processingTime: number; // milliseconds
}

export interface SpeakerSegment {
  speaker: 'agent' | 'customer';
  text: string;
  startTime: number; // seconds from call start
  endTime: number;
  confidence: number;
}

export interface CallSummary {
  id: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  customerIntent: string;
  resolution: string;
  nextSteps?: string[];
  generatedAt: string;
  aiModel: string;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  emotions: EmotionScore[];
  customerSatisfaction: number; // 1-5
  agentPerformance: number; // 1-5
}

export interface EmotionScore {
  emotion: 'happy' | 'sad' | 'angry' | 'frustrated' | 'satisfied' | 'confused';
  score: number; // 0-1
  timeRanges: TimeRange[];
}

export interface TimeRange {
  start: number; // seconds
  end: number;   // seconds
}

export interface CallQuality {
  audioQuality: number; // 1-5
  connectionQuality: number; // 1-5
  clarityScore: number; // 1-5
  backgroundNoise: 'low' | 'medium' | 'high';
  dropouts: number;
}

export interface CallMetadata {
  startTime: string;
  endTime?: string;
  cost?: number;
  tags?: string[];
  campaign?: string;
  source?: string;
  location?: {
    country: string;
    city?: string;
    timezone: string;
  };
  device?: {
    type: 'mobile' | 'landline' | 'voip';
    carrier?: string;
  };
  transferHistory?: CallTransfer[];
  notes?: string;
}

export interface CallTransfer {
  timestamp: string;
  from: string;
  to: string;
  reason: string;
  successful: boolean;
}

export interface CallFilters {
  agentId?: string;
  status?: Call['status'];
  direction?: Call['direction'];
  outcome?: Call['outcome'];
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
}

export interface BatchCallRequest {
  agentId: string;
  contacts: {
    phoneNumber: string;
    name?: string;
    metadata?: Record<string, unknown>;
  }[];
  scheduledTime?: string;
  priority: 'low' | 'medium' | 'high';
}

// Call Log from API
export interface CallLog {
  id: string | number;
  call_sid: string;
  stream_id: string;
  from_number: string;
  to_number: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  recording_link: string | null;
  organization_id: string;
  assistant_id: string;
  is_transfered: boolean;
  transfer_number: string | null;
  status: string;
  summary: string | null;
  meta_data: {
    lead_id?: string;
    lead_call_id?: string;
    product?: string;
    qna?: Array<{ id: string; quest: string; answ: string }>;
    spec_ques_1?: { Qid: string; Quest: string; Answ: string };
    spec_ques_2?: { Qid: string; Quest: string; Answ: string };
    spec_ques_3?: { Qid: string; Quest: string; Answ: string };
    spec_ques_4?: { Qid: string; Quest: string; Answ: string };
    is_business?: string;
    rescheduled_to?: string;
    product_change?: Record<string, any>;
    buyer_name?: string;
    buyer_city?: string;
    call_outcome_desc?: string;
    source?: string;
    [key: string]: any;
  };
  metrics: CallMetrics | null;
  quality: CallQualityMetrics | null;
  sentiment: string;
  outcome: string | null;
  tags: string[];
  call_type: 'inbound' | 'outbound' | 'webcall';
  insights: CallInsight[];
  key_events: CallKeyEvent[];
  customer_satisfaction: number | null;
  agent_performance: number | null;
  created_at: string;
  updated_at: string;
  transcripts: CallTranscriptEntry[];
}

export interface CallMetrics {
  clarity?: number;
  holdTime?: number;
  talkTime?: number;
  silenceTime?: number;
  responseTime?: number;
  keywordMatches?: number;
  sentimentScore?: number;
  confidenceScore?: number;
  goalAchievement?: number;
  callQualityScore?: number;
  interruptionCount?: number;
  comprehensionScore?: number;
  customerSatisfaction?: number;
}

export interface CallQualityMetrics {
  audioQuality?: number;
  clarityScore?: number;
  connectionQuality?: number;
}

export interface CallTranscriptEntry {
  id: number;
  call_id: number;
  timestamp: string;
  speaker: 'assistant' | 'user';
  text: string;
  sentiment: string;
  confidence: number;
  created_at: string;
}

export interface CallInsight {
  type: string;
  title: string;
  confidence: number;
  description?: string;
}

export interface CallKeyEvent {
  timestamp: number;
  title: string;
  description: string;
  type: string;
  severity: string;
}

export interface CallLogsParams {
  organization_id: string;
  skip?: number;
  limit?: number;
  search?: string;
  status?: string;
  call_type?: string;
}

export interface CallLogsResponse {
  call_logs: CallLog[];
  total: number;
  skip: number;
  limit: number;
}
