'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plug, PlugZap, Trash2, Settings } from 'lucide-react';
import { MCPServerConfig } from '@/lib/types';

interface MCPServerCardProps {
  server: MCPServerConfig;
  isConnected: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onDelete: () => Promise<void>;
  onSelect: () => void;
}

export function MCPServerCard({
  server,
  isConnected,
  onConnect,
  onDisconnect,
  onDelete,
  onSelect,
}: MCPServerCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setIsLoading(true);
    setError('');
    try {
      await onConnect();
    } catch (err) {
      setError(err instanceof Error ? err.message : '연결 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    setError('');
    try {
      await onDisconnect();
    } catch (err) {
      setError(err instanceof Error ? err.message : '연결 해제 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`"${server.name}" 서버를 삭제하시겠습니까?`)) {
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const getTransportLabel = () => {
    switch (server.transport) {
      case 'stdio':
        return 'STDIO';
      case 'http':
        return 'HTTP';
      case 'sse':
        return 'SSE';
      default:
        return String(server.transport).toUpperCase();
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold truncate">{server.name}</h3>
            <Badge variant={isConnected ? 'default' : 'secondary'} className="shrink-0">
              {getTransportLabel()}
            </Badge>
            {isConnected && (
              <Badge variant="default" className="shrink-0 bg-green-600">
                연결됨
              </Badge>
            )}
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            {server.transport === 'stdio' ? (
              <>
                <p className="truncate">
                  <span className="font-medium">명령어:</span> {server.command}
                </p>
                {server.args && server.args.length > 0 && (
                  <p className="truncate">
                    <span className="font-medium">인자:</span> {server.args.join(' ')}
                  </p>
                )}
              </>
            ) : (
              <p className="truncate">
                <span className="font-medium">URL:</span> {server.url}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {isConnected ? (
            <>
              <Button
                size="icon"
                variant="outline"
                onClick={onSelect}
                title="서버 관리"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={handleDisconnect}
                disabled={isLoading}
                title="연결 해제"
              >
                <PlugZap className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              size="icon"
              variant="outline"
              onClick={handleConnect}
              disabled={isLoading}
              title="연결"
            >
              <Plug className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            title="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

