import { Message, ChatSession } from './types';

const CHAT_HISTORY_KEY = 'ai-chat-history'; // 레거시 키
const CHAT_SESSIONS_KEY = 'ai-chat-sessions';
const ACTIVE_SESSION_KEY = 'ai-active-session';

/**
 * localStorage에 채팅 내역을 저장합니다. (레거시)
 */
export function saveChatHistory(messages: Message[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
}

/**
 * localStorage에서 채팅 내역을 불러옵니다. (레거시)
 */
export function loadChatHistory(): Message[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!stored) return [];
    
    return JSON.parse(stored) as Message[];
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return [];
  }
}

/**
 * localStorage에서 채팅 내역을 삭제합니다. (레거시)
 */
export function clearChatHistory(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear chat history:', error);
  }
}

// ===== 새로운 세션 기반 Storage =====

/**
 * 모든 채팅 세션을 저장합니다.
 */
export function saveChatSessions(sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save chat sessions:', error);
  }
}

/**
 * 모든 채팅 세션을 불러옵니다.
 */
export function loadChatSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(CHAT_SESSIONS_KEY);
    if (!stored) return [];

    return JSON.parse(stored) as ChatSession[];
  } catch (error) {
    console.error('Failed to load chat sessions:', error);
    return [];
  }
}

/**
 * 새 채팅 세션을 생성합니다.
 */
export function createSession(title: string = '새 채팅'): ChatSession {
  const now = Date.now();
  return {
    id: `session-${now}`,
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 세션을 업데이트합니다.
 */
export function updateSession(sessions: ChatSession[], sessionId: string, updates: Partial<ChatSession>): ChatSession[] {
  return sessions.map((session) =>
    session.id === sessionId
      ? { ...session, ...updates, updatedAt: Date.now() }
      : session
  );
}

/**
 * 세션을 삭제합니다.
 */
export function deleteSession(sessions: ChatSession[], sessionId: string): ChatSession[] {
  return sessions.filter((session) => session.id !== sessionId);
}

/**
 * 활성 세션 ID를 저장합니다.
 */
export function saveActiveSessionId(sessionId: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
  } catch (error) {
    console.error('Failed to save active session ID:', error);
  }
}

/**
 * 활성 세션 ID를 불러옵니다.
 */
export function loadActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(ACTIVE_SESSION_KEY);
  } catch (error) {
    console.error('Failed to load active session ID:', error);
    return null;
  }
}

/**
 * 레거시 채팅 데이터를 세션으로 마이그레이션합니다.
 */
export function migrateLegacyChat(): ChatSession | null {
  const legacyMessages = loadChatHistory();
  
  if (legacyMessages.length === 0) return null;

  const session = createSession('이전 채팅');
  session.messages = legacyMessages;
  session.createdAt = legacyMessages[0]?.timestamp || Date.now();
  session.updatedAt = legacyMessages[legacyMessages.length - 1]?.timestamp || Date.now();

  // 레거시 데이터 삭제
  clearChatHistory();

  return session;
}

// ===== MCP 서버 활성화 상태 Storage =====

const ENABLED_MCP_SERVERS_KEY_PREFIX = 'ai-enabled-mcp-servers-';

/**
 * 세션별 활성화된 MCP 서버 ID 목록을 저장합니다.
 */
export function saveEnabledMCPServers(sessionId: string, serverIds: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    const key = `${ENABLED_MCP_SERVERS_KEY_PREFIX}${sessionId}`;
    localStorage.setItem(key, JSON.stringify(serverIds));
  } catch (error) {
    console.error('Failed to save enabled MCP servers:', error);
  }
}

/**
 * 세션별 활성화된 MCP 서버 ID 목록을 불러옵니다.
 */
export function loadEnabledMCPServers(sessionId: string): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const key = `${ENABLED_MCP_SERVERS_KEY_PREFIX}${sessionId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    return JSON.parse(stored) as string[];
  } catch (error) {
    console.error('Failed to load enabled MCP servers:', error);
    return [];
  }
}

