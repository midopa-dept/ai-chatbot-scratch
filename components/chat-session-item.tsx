'use client';

import { useState } from 'react';
import { MessageSquare, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatSession } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ChatSessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

export function ChatSessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: ChatSessionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== session.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(session.title);
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`"${session.title}" 채팅을 삭제하시겠습니까?`)) {
      onDelete();
    }
  };

  const lastMessage = session.messages[session.messages.length - 1];
  const preview = lastMessage?.content.substring(0, 30) || '메시지 없음';

  return (
    <div
      className={cn(
        'group relative px-3 py-2 rounded-lg cursor-pointer transition-colors',
        isActive
          ? 'bg-accent'
          : 'hover:bg-accent/50'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        <MessageSquare className="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" />
        
        <div className="flex-1 min-w-0 max-w-[140px]">
          {isEditing ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') handleCancel();
                }}
                className="h-7 text-sm"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                onClick={handleRename}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                onClick={handleCancel}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <h3 className="font-medium text-sm truncate">{session.title}</h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {preview}
              </p>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-auto">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

