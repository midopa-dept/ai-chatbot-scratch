'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/contexts/chat-context';
import { ChatSessionItem } from './chat-session-item';

export function ChatSidebar() {
  const {
    sessions,
    activeSessionId,
    createNewSession,
    switchSession,
    deleteSession,
    renameSession,
  } = useChat();

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* 헤더 */}
      <div className="p-4 border-b border-border">
        <Button
          onClick={createNewSession}
          className="w-full"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          새 채팅
        </Button>
      </div>

      {/* 세션 목록 */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              채팅이 없습니다
            </div>
          ) : (
            sessions.map((session) => (
              <ChatSessionItem
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                onSelect={() => switchSession(session.id)}
                onDelete={() => deleteSession(session.id)}
                onRename={(title) => renameSession(session.id, title)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* 푸터 */}
      <div className="p-4 border-t border-border text-xs text-muted-foreground">
        <p className="text-center">
          총 {sessions.length}개의 채팅
        </p>
      </div>
    </div>
  );
}

