'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Menu, X, Wrench, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Message, ToolCall } from '@/lib/types';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { ChatSidebar } from '@/components/chat-sidebar';
import { useChat } from '@/contexts/chat-context';
import { useMCP } from '@/contexts/mcp-context';
import { saveEnabledMCPServers, loadEnabledMCPServers } from '@/lib/storage';

export default function ChatPage() {
  const {
    activeSession,
    activeSessionId,
    addMessage,
    updateMessage,
    clearMessages,
    generateSessionTitle,
  } = useChat();

  const { servers, connectionStatuses, tools } = useMCP();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [enabledMCPServers, setEnabledMCPServers] = useState<Set<string>>(new Set());
  const [isMCPDialogOpen, setIsMCPDialogOpen] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const messages = activeSession?.messages || [];

  // 연결된 MCP 서버만 필터링
  const connectedServers = servers.filter(s => connectionStatuses.get(s.id));

  // 세션별 활성화된 MCP 서버 로드
  useEffect(() => {
    if (activeSessionId) {
      const savedServers = loadEnabledMCPServers(activeSessionId);
      setEnabledMCPServers(new Set(savedServers));
    }
  }, [activeSessionId]);

  // 활성화된 MCP 서버 변경 시 저장
  useEffect(() => {
    if (activeSessionId && enabledMCPServers.size > 0) {
      saveEnabledMCPServers(activeSessionId, Array.from(enabledMCPServers));
    }
  }, [activeSessionId, enabledMCPServers]);

  // 스크롤 자동 하단 이동 (메시지 변경 또는 세션 전환 시)
  useEffect(() => {
    // scrollViewportRef가 컨텐츠 div를 가리키므로, 부모의 부모가 viewport
    if (scrollViewportRef.current) {
      const viewport = scrollViewportRef.current.parentElement?.parentElement;
      if (viewport && viewport.hasAttribute('data-radix-scroll-area-viewport')) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages.length, activeSessionId]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    addMessage(userMessage);

    // 첫 메시지인 경우 제목 생성
    if (messages.length === 0) {
      generateSessionTitle(input.trim());
    }

    setInput('');
    setIsLoading(true);

    // AI 응답 메시지 초기화
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    addMessage(assistantMessage);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          enabledServerIds: Array.from(enabledMCPServers),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let accumulatedText = '';
      const toolCalls: ToolCall[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              
              // 텍스트 스트리밍
              if (parsed.text) {
                accumulatedText += parsed.text;
                updateMessage(assistantMessageId, { 
                  content: accumulatedText,
                  toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                });
              }
              
              // Tool 호출 정보
              if (parsed.toolCall) {
                const newToolCall: ToolCall = {
                  server: parsed.toolCall.server,
                  tool: parsed.toolCall.tool,
                  args: parsed.toolCall.args,
                };
                toolCalls.push(newToolCall);
                updateMessage(assistantMessageId, { 
                  content: accumulatedText,
                  toolCalls,
                });
              }
              
              // Tool 실행 결과
              if (parsed.toolResult) {
                const toolCall = toolCalls.find(tc => tc.tool === parsed.toolResult.tool);
                if (toolCall) {
                  toolCall.result = parsed.toolResult.result;
                  updateMessage(assistantMessageId, { 
                    content: accumulatedText,
                    toolCalls,
                  });
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Chat error:', error);
        updateMessage(assistantMessageId, {
          content: '죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요.',
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToggleMCPServer = (serverId: string, enabled: boolean) => {
    setEnabledMCPServers(prev => {
      const newSet = new Set(prev);
      if (enabled) {
        newSet.add(serverId);
      } else {
        newSet.delete(serverId);
      }
      return newSet;
    });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* 사이드바 - 데스크톱 */}
      <div
        className={`hidden md:block transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-0'
        }`}
      >
        {isSidebarOpen && <ChatSidebar />}
      </div>

      {/* 사이드바 - 모바일 */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-background">
            <ChatSidebar />
          </div>
        </div>
      )}

      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 헤더 */}
        <header className="border-b border-border bg-card px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">
                  {activeSession?.title || '새 채팅'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Powered by Gemini 2.0 Flash
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isMCPDialogOpen} onOpenChange={setIsMCPDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden md:flex"
                  >
                    <Wrench className="w-4 h-4 mr-2" />
                    MCP Tools ({enabledMCPServers.size})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>MCP Tools 선택</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {connectedServers.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>연결된 MCP 서버가 없습니다.</p>
                        <Button
                          variant="link"
                          onClick={() => {
                            setIsMCPDialogOpen(false);
                            window.location.href = '/mcp';
                          }}
                          className="mt-2"
                        >
                          MCP 서버 관리로 이동
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {connectedServers.map(server => {
                          const serverTools = tools.get(server.id) || [];
                          const isEnabled = enabledMCPServers.has(server.id);
                          
                          return (
                            <div
                              key={server.id}
                              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                              <Checkbox
                                checked={isEnabled}
                                onCheckedChange={(checked) => 
                                  handleToggleMCPServer(server.id, checked as boolean)
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{server.name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {serverTools.length} tools
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {server.transport}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (window.location.href = '/mcp')}
                className="hidden md:flex"
              >
                <Settings className="w-4 h-4 mr-2" />
                MCP 관리
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearMessages}
                disabled={messages.length === 0}
                className="hidden md:flex"
              >
                내역 삭제
              </Button>
            </div>
          </div>
        </header>

        {/* 채팅 영역 */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div ref={scrollViewportRef} className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Bot className="w-16 h-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">
                    안녕하세요! 무엇을 도와드릴까요?
                  </h2>
                  <p className="text-muted-foreground">
                    메시지를 입력하여 대화를 시작하세요.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-5 h-5" />
                      ) : (
                        <Bot className="w-5 h-5" />
                      )}
                    </div>
                    <div className="max-w-[85%] md:max-w-[80%] space-y-2">
                      {/* Tool 호출 표시 */}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="space-y-2">
                          {message.toolCalls.map((toolCall, idx) => (
                            <Card
                              key={idx}
                              className="bg-secondary/50 border-secondary px-3 py-2 text-sm"
                            >
                              <div className="flex items-center gap-2 text-secondary-foreground">
                                <Wrench className="w-4 h-4" />
                                <span className="font-medium">
                                  {toolCall.tool}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({toolCall.server})
                                </span>
                              </div>
                              {toolCall.result !== undefined && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <div className="font-medium">Result:</div>
                                  <pre className="mt-1 overflow-auto">
                                    {JSON.stringify(toolCall.result, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* 메시지 내용 */}
                      <Card
                        className={`px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          message.content ? (
                            <MarkdownRenderer
                              content={message.content}
                              isStreaming={
                                isLoading &&
                                message.id === messages[messages.length - 1]?.id
                              }
                            />
                          ) : (
                            <span className="text-muted-foreground italic">
                              응답 대기 중...
                            </span>
                          )
                        ) : (
                          <p className="whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        )}
                      </Card>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 입력 영역 */}
        <div className="border-t border-border bg-card px-4 md:px-6 py-4">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
