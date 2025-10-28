'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { MCPServerConfig, MCPTransportType } from '@/lib/types';

interface MCPServerFormProps {
  onSubmit: (server: MCPServerConfig) => Promise<void>;
  initialData?: MCPServerConfig;
  onCancel?: () => void;
}

export function MCPServerForm({ onSubmit, initialData, onCancel }: MCPServerFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [transport, setTransport] = useState<MCPTransportType>(
    initialData?.transport || 'http'
  );
  const [command, setCommand] = useState(initialData?.command || '');
  const [args, setArgs] = useState(initialData?.args?.join(' ') || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!name.trim()) {
      setError('서버 이름을 입력하세요.');
      return;
    }

    if (transport === 'stdio' && !command.trim()) {
      setError('명령어를 입력하세요.');
      return;
    }

    if ((transport === 'http' || transport === 'sse') && !url.trim()) {
      setError('URL을 입력하세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      const serverConfig: MCPServerConfig = {
        id: initialData?.id || `server-${Date.now()}`,
        name: name.trim(),
        transport,
      };

      if (transport === 'stdio') {
        serverConfig.command = command.trim();
        serverConfig.args = args
          .trim()
          .split(' ')
          .filter((arg) => arg);
      } else {
        serverConfig.url = url.trim();
      }

      await onSubmit(serverConfig);

      // 초기화
      if (!initialData) {
        setName('');
        setCommand('');
        setArgs('');
        setUrl('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '서버 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">서버 이름</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My MCP Server"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label>Transport 타입</Label>
        <RadioGroup
          value={transport}
          onValueChange={(value) => setTransport(value as MCPTransportType)}
          disabled={isSubmitting}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="http" id="http" />
            <Label htmlFor="http" className="font-normal cursor-pointer">
              HTTP (Streamable HTTP)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sse" id="sse" />
            <Label htmlFor="sse" className="font-normal cursor-pointer">
              SSE (Server-Sent Events)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="stdio" id="stdio" />
            <Label htmlFor="stdio" className="font-normal cursor-pointer">
              STDIO (로컬 프로세스)
            </Label>
          </div>
        </RadioGroup>
        {transport === 'stdio' && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && (
          <div className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950 px-3 py-2 rounded border border-amber-200 dark:border-amber-800">
            ⚠️ STDIO는 로컬 개발 환경에서만 작동합니다. Vercel 등 서버리스 환경에서는 HTTP 또는 SSE를 사용하세요.
          </div>
        )}
      </div>

      {transport === 'stdio' ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="command">명령어</Label>
            <Input
              id="command"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="node"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="args">인자 (공백으로 구분)</Label>
            <Textarea
              id="args"
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              placeholder="server.js --port 3000"
              disabled={isSubmitting}
              rows={3}
            />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="url">서버 URL</Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://localhost:3000/mcp"
            disabled={isSubmitting}
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : initialData ? '업데이트' : '추가'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            취소
          </Button>
        )}
      </div>
    </form>
  );
}

