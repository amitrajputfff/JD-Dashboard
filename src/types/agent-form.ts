export interface AgentFormData {
  name: string
  description: string
  tags: string[]
  industry: string
  useCase: string
  provider: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  firstMessageMode: string
  firstMessage: string
  voice: string
  voiceSpeed: number
  voicePitch: number
  transcriber: string
  language: string
  enableRealTimeTranscription: boolean
  enableMemory: boolean
  enableAnalytics: boolean
  enableRecording: boolean
  maxCallDuration: number
  selectedFiles: string[]
}

export interface ProviderOption {
  id: string
  name: string
  icon: React.ReactNode
  description: string
}

export interface ModelOption {
  id: string
  name: string
  description: string
  latency: string
  cost: string
  category?: string
}

export interface VoiceOption {
  id: string
  name: string
  description: string
  accent: string
  gender: string
}

export interface TranscriberOption {
  id: string
  name: string
  description: string
  accuracy: string
  features: string[]
}
