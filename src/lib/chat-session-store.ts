import { ChatSession, ChatMessage } from '@/types/chat';

// In-memory store for chat sessions
// In production, this should be replaced with a proper database
class ChatSessionStore {
  private sessions: Map<string, ChatSession> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Clean up expired sessions every 5 minutes
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  createSession(): ChatSession {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();
    
    const session: ChatSession = {
      id: sessionId,
      messages: [],
      createdAt: now,
      lastActivity: now
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): ChatSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Check if session has expired
    const now = Date.now();
    const lastActivity = new Date(session.lastActivity).getTime();
    if (now - lastActivity > this.SESSION_TIMEOUT) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  addMessage(sessionId: string, message: ChatMessage): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }

    session.messages.push(message);
    session.lastActivity = new Date().toISOString();
    return true;
  }

  getChatHistory(sessionId: string): ChatMessage[] {
    const session = this.getSession(sessionId);
    return session ? session.messages : [];
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      const lastActivity = new Date(session.lastActivity).getTime();
      if (now - lastActivity > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Export a singleton instance
export const chatSessionStore = new ChatSessionStore();
