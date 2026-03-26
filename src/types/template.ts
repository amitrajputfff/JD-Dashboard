export interface AgentTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  industry: string[]
  useCase: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedSetupTime: string
  icon: string
  color: string
  featured: boolean
  tags: string[]
  configuration: {
    // Basic Info
    name: string
    description: string
    type: 'Inbound' | 'Outbound' | 'Both'
    
    // LLM Configuration
    provider: string
    model: string
    systemPrompt: string
    temperature: number
    maxTokens: number
    
    // Voice Configuration
    ttsProvider: string
    ttsVoice: string
    speakingRate: number
    pitch: string
    
    // Speech Recognition
    sttProvider: string
    sttModel: string
    language: string
    
    // Advanced Settings
    callRecording: boolean
    vadEnabled: boolean
    bargeInEnabled: boolean
    backgroundNoiseSuppression: boolean
    functionCalling: boolean
    functionSchema?: string
    maxCallDuration: number
    silenceTimeout: number
  }
  metadata: {
    createdBy: string
    createdAt: string
    updatedAt: string
    version: string
    downloads: number
    rating: number
    reviews: number
  }
  preview?: {
    sampleConversation: string[]
    keyFeatures: string[]
    benefits: string[]
  }
}

export type TemplateCategory = 
  | 'customer-service'
  | 'sales'
  | 'healthcare' 
  | 'education'
  | 'real-estate'
  | 'finance'
  | 'hospitality'
  | 'retail'
  | 'logistics'
  | 'general'

export interface TemplateFilter {
  category?: TemplateCategory
  industry?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  search?: string
  featured?: boolean
}

export interface TemplateStats {
  totalTemplates: number
  categoryCounts: Record<TemplateCategory, number>
  popularTemplates: string[]
  recentlyAdded: string[]
}
