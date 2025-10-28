'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ChatSession, Message } from '@/lib/types';
import {
  saveChatSessions,
  loadChatSessions,
  createSession,
  updateSession as updateSessionUtil,
  deleteSession as deleteSessionUtil,
  saveActiveSessionId,
  loadActiveSessionId,
  migrateLegacyChat,
} from '@/lib/storage';

interface ChatContextType {
  sessions: ChatSession[];
  activeSessionId: string | null;
  activeSession: ChatSession | null;

  // 세션 관리
  createNewSession: () => void;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, title: string) => void;

  // 메시지 관리
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  clearMessages: () => void;

  // 유틸리티
  generateSessionTitle: (firstMessage: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // 초기 로드 및 마이그레이션
  useEffect(() => {
    const loadedSessions = loadChatSessions();
    const legacySession = migrateLegacyChat();

    let initialSessions = loadedSessions;

    // 레거시 데이터가 있으면 세션에 추가
    if (legacySession) {
      initialSessions = [legacySession, ...loadedSessions];
      saveChatSessions(initialSessions);
    }

    // 세션이 없으면 새로 생성
    if (initialSessions.length === 0) {
      const newSession = createSession();
      initialSessions = [newSession];
      saveChatSessions(initialSessions);
    }

    setSessions(initialSessions);

    // 활성 세션 설정
    const savedActiveId = loadActiveSessionId();
    const activeId = savedActiveId && initialSessions.some(s => s.id === savedActiveId)
      ? savedActiveId
      : initialSessions[0].id;

    setActiveSessionId(activeId);
    saveActiveSessionId(activeId);
  }, []);

  // 세션 변경 시 저장
  useEffect(() => {
    if (sessions.length > 0) {
      saveChatSessions(sessions);
    }
  }, [sessions]);

  // 활성 세션
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // 새 세션 생성
  const createNewSession = useCallback(() => {
    const newSession = createSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    saveActiveSessionId(newSession.id);
  }, []);

  // 세션 전환
  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    saveActiveSessionId(sessionId);
  }, []);

  // 세션 삭제
  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const updated = deleteSessionUtil(prev, sessionId);

      // 삭제된 세션이 활성 세션인 경우
      if (sessionId === activeSessionId) {
        if (updated.length > 0) {
          setActiveSessionId(updated[0].id);
          saveActiveSessionId(updated[0].id);
        } else {
          // 모든 세션이 삭제된 경우 새 세션 생성
          const newSession = createSession();
          setActiveSessionId(newSession.id);
          saveActiveSessionId(newSession.id);
          return [newSession];
        }
      }

      return updated;
    });
  }, [activeSessionId]);

  // 세션 이름 변경
  const renameSession = useCallback((sessionId: string, title: string) => {
    setSessions((prev) => updateSessionUtil(prev, sessionId, { title }));
  }, []);

  // 메시지 추가
  const addMessage = useCallback((message: Message) => {
    if (!activeSessionId) return;

    setSessions((prev) => {
      const session = prev.find((s) => s.id === activeSessionId);
      if (!session) return prev;

      return updateSessionUtil(prev, activeSessionId, {
        messages: [...session.messages, message],
      });
    });
  }, [activeSessionId]);

  // 메시지 업데이트
  const updateMessage = useCallback(
    (messageId: string, updates: Partial<Message>) => {
      if (!activeSessionId) return;

      setSessions((prev) => {
        const session = prev.find((s) => s.id === activeSessionId);
        if (!session) return prev;

        const updatedMessages = session.messages.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        );

        return updateSessionUtil(prev, activeSessionId, { messages: updatedMessages });
      });
    },
    [activeSessionId]
  );

  // 메시지 초기화
  const clearMessages = useCallback(() => {
    if (!activeSessionId) return;

    setSessions((prev) => updateSessionUtil(prev, activeSessionId, { messages: [] }));
  }, [activeSessionId]);

  // 세션 제목 자동 생성
  const generateSessionTitle = useCallback(
    async (firstMessage: string) => {
      if (!activeSessionId) return;

      try {
        const response = await fetch('/api/chat/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: firstMessage }),
        });

        if (response.ok) {
          const { title } = await response.json();
          renameSession(activeSessionId, title);
        }
      } catch (error) {
        console.error('Failed to generate session title:', error);
      }
    },
    [activeSessionId, renameSession]
  );

  const value: ChatContextType = {
    sessions,
    activeSessionId,
    activeSession,
    createNewSession,
    switchSession,
    deleteSession,
    renameSession,
    addMessage,
    updateMessage,
    clearMessages,
    generateSessionTitle,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

