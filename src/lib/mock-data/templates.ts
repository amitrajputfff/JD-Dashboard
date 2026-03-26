import { AgentTemplate } from '@/types/template'

export const mockTemplates: AgentTemplate[] = [
  {
    id: 'customer-support-basic',
    name: 'Customer Support Assistant',
    description: 'Handle common customer inquiries, provide product information, and escalate complex issues',
    category: 'customer-service',
    industry: ['Technology', 'E-commerce', 'SaaS'],
    useCase: 'First-line customer support for common inquiries and issue resolution',
    difficulty: 'beginner',
    estimatedSetupTime: '5-10 minutes',
    icon: '🎧',
    color: 'bg-blue-500',
    featured: true,
    tags: ['customer service', 'support', 'FAQ', 'basic'],
    configuration: {
      name: 'Customer Support Assistant',
      description: 'Friendly AI assistant to help customers with their questions and concerns',
      type: 'Inbound',
      provider: 'OpenAI',
      model: 'gpt-4',
      systemPrompt: `You are a helpful customer support assistant. Your role is to:
- Greet customers warmly and professionally
- Listen to their concerns and questions
- Provide accurate information about products and services
- Offer solutions to common problems
- Escalate complex issues to human agents when necessary
- Maintain a positive and empathetic tone throughout the conversation

Always be patient, understanding, and solution-oriented. If you don't know something, admit it and offer to connect them with someone who can help.`,
      temperature: 0.7,
      maxTokens: 800,
      ttsProvider: 'Azure',
      ttsVoice: 'en-US-AriaNeural',
      speakingRate: 1.0,
      pitch: '0%',
      sttProvider: 'Azure',
      sttModel: 'whisper-1',
      language: 'en-US',
      callRecording: true,
      vadEnabled: true,
      bargeInEnabled: true,
      backgroundNoiseSuppression: true,
      functionCalling: false,
      maxCallDuration: 30,
      silenceTimeout: 8
    },
    metadata: {
      createdBy: 'JustDial Team',
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      version: '1.2',
      downloads: 1247,
      rating: 4.8,
      reviews: 89
    },
    preview: {
      sampleConversation: [
        "Hi! Thanks for calling. How can I help you today?",
        "I understand you're having trouble with your order. Let me look into that for you.",
        "I can see your order was placed yesterday. It's currently being processed and should ship within 24 hours.",
        "Is there anything else I can help you with today?"
      ],
      keyFeatures: [
        'Warm, professional greeting',
        'Active listening and empathy',
        'Product knowledge base integration',
        'Escalation to human agents',
        'Order status checking'
      ],
      benefits: [
        'Reduces wait times for customers',
        'Handles 80% of common inquiries',
        'Consistent service quality',
        'Available 24/7'
      ]
    }
  },
  {
    id: 'sales-lead-qualifier',
    name: 'Sales Lead Qualifier',
    description: 'Qualify leads, gather contact information, and schedule appointments with sales team',
    category: 'sales',
    industry: ['Real Estate', 'B2B Services', 'Insurance'],
    useCase: 'Outbound lead qualification and appointment scheduling',
    difficulty: 'intermediate',
    estimatedSetupTime: '10-15 minutes',
    icon: '💼',
    color: 'bg-green-500',
    featured: true,
    tags: ['sales', 'lead qualification', 'appointment', 'outbound'],
    configuration: {
      name: 'Sales Lead Qualifier',
      description: 'Professional sales assistant for lead qualification and appointment booking',
      type: 'Outbound',
      provider: 'OpenAI',
      model: 'gpt-4',
      systemPrompt: `You are a professional sales development representative. Your goals are to:
- Introduce yourself and your company professionally
- Qualify leads based on budget, authority, need, and timeline (BANT)
- Gather key contact and company information
- Assess the prospect's interest level and pain points
- Schedule qualified meetings with the sales team
- Maintain a consultative, not pushy approach

Be friendly but professional. Ask open-ended questions to understand their business needs. If they're not interested, thank them politely and end the call.`,
      temperature: 0.8,
      maxTokens: 1000,
      ttsProvider: 'Azure',
      ttsVoice: 'en-US-JennyNeural',
      speakingRate: 0.9,
      pitch: '0%',
      sttProvider: 'Azure',
      sttModel: 'whisper-1',
      language: 'en-US',
      callRecording: true,
      vadEnabled: true,
      bargeInEnabled: true,
      backgroundNoiseSuppression: true,
      functionCalling: true,
      functionSchema: '{"name": "schedule_appointment", "description": "Schedule a meeting with the sales team"}',
      maxCallDuration: 20,
      silenceTimeout: 6
    },
    metadata: {
      createdBy: 'JustDial Team',
      createdAt: '2024-01-08T00:00:00Z',
      updatedAt: '2024-01-14T00:00:00Z',
      version: '1.1',
      downloads: 892,
      rating: 4.6,
      reviews: 67
    },
    preview: {
      sampleConversation: [
        "Hi, this is Sarah from TechSolutions. I'm calling because you recently visited our website.",
        "I'd love to learn more about your current challenges with project management.",
        "What's your biggest pain point when it comes to team collaboration?",
        "Based on what you've shared, I think our solution could really help. Would you be interested in a 15-minute demo?"
      ],
      keyFeatures: [
        'BANT qualification framework',
        'Natural conversation flow',
        'Appointment scheduling integration',
        'Lead scoring and notes',
        'CRM integration ready'
      ],
      benefits: [
        'Increases qualified leads by 40%',
        'Saves 10+ hours per week for sales team',
        'Consistent qualification process',
        'Higher conversion rates'
      ]
    }
  },
  {
    id: 'healthcare-appointment',
    name: 'Healthcare Appointment Scheduler',
    description: 'Schedule patient appointments, handle insurance verification, and provide basic health information',
    category: 'healthcare',
    industry: ['Healthcare', 'Medical Practice', 'Telehealth'],
    useCase: 'Patient appointment scheduling and basic medical assistance',
    difficulty: 'advanced',
    estimatedSetupTime: '15-20 minutes',
    icon: '🏥',
    color: 'bg-red-500',
    featured: false,
    tags: ['healthcare', 'appointments', 'HIPAA', 'medical'],
    configuration: {
      name: 'Healthcare Appointment Scheduler',
      description: 'HIPAA-compliant assistant for medical appointment scheduling',
      type: 'Inbound',
      provider: 'Azure OpenAI',
      model: 'gpt-4',
      systemPrompt: `You are a healthcare appointment scheduler. Your responsibilities include:
- Greeting patients professionally and maintaining HIPAA compliance
- Scheduling appointments with available providers
- Collecting necessary patient information
- Verifying insurance information
- Providing basic information about services
- Following up on appointment confirmations
- Handling cancellations and rescheduling

IMPORTANT: Never provide medical advice. Always maintain patient confidentiality and follow HIPAA guidelines. Escalate medical questions to healthcare providers.`,
      temperature: 0.6,
      maxTokens: 900,
      ttsProvider: 'Azure',
      ttsVoice: 'en-US-AriaNeural',
      speakingRate: 0.95,
      pitch: '0%',
      sttProvider: 'Azure',
      sttModel: 'whisper-1',
      language: 'en-US',
      callRecording: true,
      vadEnabled: true,
      bargeInEnabled: false,
      backgroundNoiseSuppression: true,
      functionCalling: true,
      functionSchema: '{"name": "schedule_appointment", "description": "Schedule medical appointment"}',
      maxCallDuration: 25,
      silenceTimeout: 10
    },
    metadata: {
      createdBy: 'JustDial Healthcare',
      createdAt: '2024-01-12T00:00:00Z',
      updatedAt: '2024-01-16T00:00:00Z',
      version: '1.0',
      downloads: 234,
      rating: 4.9,
      reviews: 23
    }
  },
  {
    id: 'restaurant-reservations',
    name: 'Restaurant Reservation Assistant',
    description: 'Handle table reservations, menu inquiries, and special event bookings',
    category: 'hospitality',
    industry: ['Restaurant', 'Hospitality', 'Food Service'],
    useCase: 'Restaurant table reservations and customer inquiries',
    difficulty: 'beginner',
    estimatedSetupTime: '5-8 minutes',
    icon: '🍽️',
    color: 'bg-orange-500',
    featured: false,
    tags: ['restaurant', 'reservations', 'hospitality', 'food'],
    configuration: {
      name: 'Restaurant Reservation Assistant',
      description: 'Friendly assistant for restaurant bookings and inquiries',
      type: 'Inbound',
      provider: 'OpenAI',
      model: 'gpt-3.5-turbo',
      systemPrompt: `You are a friendly restaurant reservation assistant. Your role is to:
- Greet callers warmly and represent the restaurant professionally
- Take table reservations for available time slots
- Provide information about menu items, specials, and pricing
- Handle special requests (dietary restrictions, celebrations, etc.)
- Give directions and parking information
- Take contact information for reservations
- Confirm reservation details

Always be enthusiastic about the restaurant and make guests feel welcome. If you can't accommodate a request, offer alternatives when possible.`,
      temperature: 0.8,
      maxTokens: 700,
      ttsProvider: 'Azure',
      ttsVoice: 'en-US-JennyNeural',
      speakingRate: 1.1,
      pitch: '2%',
      sttProvider: 'Azure',
      sttModel: 'whisper-1',
      language: 'en-US',
      callRecording: true,
      vadEnabled: true,
      bargeInEnabled: true,
      backgroundNoiseSuppression: true,
      functionCalling: true,
      functionSchema: '{"name": "check_availability", "description": "Check table availability"}',
      maxCallDuration: 15,
      silenceTimeout: 7
    },
    metadata: {
      createdBy: 'Hospitality Solutions',
      createdAt: '2024-01-09T00:00:00Z',
      updatedAt: '2024-01-13T00:00:00Z',
      version: '1.3',
      downloads: 567,
      rating: 4.7,
      reviews: 45
    }
  },
  {
    id: 'real-estate-lead',
    name: 'Real Estate Lead Capture',
    description: 'Capture property inquiries, schedule showings, and qualify potential buyers',
    category: 'real-estate',
    industry: ['Real Estate', 'Property Management'],
    useCase: 'Property inquiry handling and showing scheduling',
    difficulty: 'intermediate',
    estimatedSetupTime: '12-15 minutes',
    icon: '🏠',
    color: 'bg-purple-500',
    featured: true,
    tags: ['real estate', 'property', 'showings', 'leads'],
    configuration: {
      name: 'Real Estate Lead Capture',
      description: 'Professional assistant for property inquiries and showings',
      type: 'Both',
      provider: 'OpenAI',
      model: 'gpt-4',
      systemPrompt: `You are a knowledgeable real estate assistant. Your objectives are to:
- Capture leads from property inquiries
- Qualify potential buyers (budget, timeline, preferences)
- Schedule property showings and open houses
- Provide property information and neighborhood details
- Collect contact information for follow-up
- Answer questions about the buying/selling process
- Connect serious inquiries with licensed agents

Be professional, knowledgeable, and helpful. Focus on understanding their needs and matching them with suitable properties.`,
      temperature: 0.7,
      maxTokens: 950,
      ttsProvider: 'Azure',
      ttsVoice: 'en-US-AriaNeural',
      speakingRate: 1.0,
      pitch: '0%',
      sttProvider: 'Azure',
      sttModel: 'whisper-1',
      language: 'en-US',
      callRecording: true,
      vadEnabled: true,
      bargeInEnabled: true,
      backgroundNoiseSuppression: true,
      functionCalling: true,
      functionSchema: '{"name": "schedule_showing", "description": "Schedule property showing"}',
      maxCallDuration: 20,
      silenceTimeout: 8
    },
    metadata: {
      createdBy: 'RealEstate Pro',
      createdAt: '2024-01-11T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      version: '1.1',
      downloads: 445,
      rating: 4.5,
      reviews: 38
    }
  },
  {
    id: 'education-enrollment',
    name: 'Student Enrollment Assistant',
    description: 'Handle course inquiries, enrollment processes, and provide academic information',
    category: 'education',
    industry: ['Education', 'Online Learning', 'Universities'],
    useCase: 'Student enrollment and academic inquiry assistance',
    difficulty: 'intermediate',
    estimatedSetupTime: '10-12 minutes',
    icon: '🎓',
    color: 'bg-indigo-500',
    featured: false,
    tags: ['education', 'enrollment', 'courses', 'students'],
    configuration: {
      name: 'Student Enrollment Assistant',
      description: 'Helpful assistant for student enrollment and academic inquiries',
      type: 'Inbound',
      provider: 'OpenAI',
      model: 'gpt-4',
      systemPrompt: `You are a student enrollment assistant. Your role includes:
- Providing information about courses, programs, and requirements
- Assisting with the enrollment process
- Answering questions about tuition, financial aid, and scholarships
- Explaining admission requirements and deadlines
- Scheduling appointments with academic advisors
- Providing campus information and resources
- Helping with course selection guidance

Be encouraging, informative, and patient. Help students navigate their educational journey with confidence.`,
      temperature: 0.7,
      maxTokens: 850,
      ttsProvider: 'Azure',
      ttsVoice: 'en-US-AriaNeural',
      speakingRate: 0.95,
      pitch: '0%',
      sttProvider: 'Azure',
      sttModel: 'whisper-1',
      language: 'en-US',
      callRecording: true,
      vadEnabled: true,
      bargeInEnabled: true,
      backgroundNoiseSuppression: true,
      functionCalling: false,
      maxCallDuration: 25,
      silenceTimeout: 10
    },
    metadata: {
      createdBy: 'EduTech Solutions',
      createdAt: '2024-01-13T00:00:00Z',
      updatedAt: '2024-01-16T00:00:00Z',
      version: '1.0',
      downloads: 178,
      rating: 4.6,
      reviews: 12
    }
  }
]

export const templateCategories = [
  { id: 'customer-service', name: 'Customer Service', icon: '🎧', color: 'bg-blue-500' },
  { id: 'sales', name: 'Sales & Marketing', icon: '💼', color: 'bg-green-500' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: 'bg-red-500' },
  { id: 'education', name: 'Education', icon: '🎓', color: 'bg-indigo-500' },
  { id: 'real-estate', name: 'Real Estate', icon: '🏠', color: 'bg-purple-500' },
  { id: 'finance', name: 'Finance', icon: '💰', color: 'bg-yellow-500' },
  { id: 'hospitality', name: 'Hospitality', icon: '🍽️', color: 'bg-orange-500' },
  { id: 'retail', name: 'Retail', icon: '🛍️', color: 'bg-pink-500' },
  { id: 'logistics', name: 'Logistics', icon: '📦', color: 'bg-gray-500' },
  { id: 'general', name: 'General', icon: '⚡', color: 'bg-slate-500' }
] as const
