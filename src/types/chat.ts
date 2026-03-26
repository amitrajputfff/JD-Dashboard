export interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
  lastActivity: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
}

export interface ChatResponse {
  message: string;
  session_id: string;
  success: boolean;
  error?: string;
}

