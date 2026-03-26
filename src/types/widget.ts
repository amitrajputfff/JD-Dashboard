/**
 * Widget Configuration Types
 * These types define the structure for saving and retrieving widget configurations
 */

export interface WidgetConfig {
  // Visual Settings
  mode: 'chat' | 'voice' | 'both';
  theme: 'light' | 'dark' | 'auto';
  baseBgColor: string;
  accentColor: string;
  ctaButtonColor: string;
  ctaButtonTextColor: string;
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  size: 'small' | 'medium' | 'large' | 'full';
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  // Text Content
  title: string;
  startButtonText: string;
  endButtonText: string;
  chatFirstMessage: string;
  chatPlaceholder: string;
  
  // Voice Settings
  voiceShowTranscript: boolean;
  
  // Consent Settings
  consentRequired: boolean;
  consentTitle: string;
  consentContent: string;
  consentStorageKey: string;
  
  // Custom Branding
  customImageUrl: string;
  helpTexts: string[];
  agentDisplayName: string;
  
  // Language Support
  languageSelectorEnabled: boolean;
  languages: Array<{ name: string; assistantId: string }>;
}

export interface SaveWidgetConfigRequest {
  assistant_id: string;
  config: WidgetConfig;
}

export interface SaveWidgetConfigResponse {
  success: boolean;
  message: string;
  assistant_id: string;
  config: WidgetConfig;
  updated_at: string;
}

export interface GetWidgetConfigResponse {
  assistant_id: string;
  config: WidgetConfig | null;
  created_at: string | null;
  updated_at: string | null;
}

// Default widget configuration
export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  mode: 'chat',
  theme: 'light',
  baseBgColor: '#ffffff',
  accentColor: '#9333ea',
  ctaButtonColor: '#000000',
  ctaButtonTextColor: '#ffffff',
  borderRadius: 'large',
  size: 'full',
  position: 'bottom-right',
  title: 'TALK WITH AI',
  startButtonText: 'Start',
  endButtonText: 'End Call',
  chatFirstMessage: 'Hey, How can I help you today?',
  chatPlaceholder: 'Type your message...',
  voiceShowTranscript: true,
  consentRequired: true,
  consentTitle: 'Terms and conditions',
  consentContent: 'By clicking "Agree," and each time I interact with this AI agent, I consent to the recording, storage, and sharing of my communications with third-party service providers, and as otherwise described in our Terms of Service.',
  consentStorageKey: 'lia_widget_consent',
  customImageUrl: '',
  helpTexts: ['Ask Lia', 'Talk to Lia', 'Chat with Lia', 'Need Help?', 'Ask Anything', 'Get Answers'],
  agentDisplayName: 'Lia',
  languageSelectorEnabled: false,
  languages: []
};

