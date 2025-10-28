'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Download, Upload } from 'lucide-react';
import { useMCP } from '@/contexts/mcp-context';
import { MCPServerForm } from '@/components/mcp-server-form';
import { MCPServerCard } from '@/components/mcp-server-card';
import { MCPToolTester } from '@/components/mcp-tool-tester';
import { exportMCPConfig, importMCPConfig } from '@/lib/mcp-storage';
import { MCPServerConfig } from '@/lib/types';

export default function MCPPage() {
  const {
    servers,
    tools,
    prompts,
    resources,
    addServer,
    deleteServer,
    connect,
    disconnect,
    isConnected,
    callTool,
  } = useMCP();

  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const selectedServer = servers.find((s) => s.id === selectedServerId);
  const selectedServerTools = selectedServerId ? tools.get(selectedServerId) || [] : [];
  const selectedServerPrompts = selectedServerId ? prompts.get(selectedServerId) || [] : [];
  const selectedServerResources = selectedServerId ? resources.get(selectedServerId) || [] : [];

  const handleAddServer = async (server: MCPServerConfig) => {
    await addServer(server);
    setIsAddDialogOpen(false);
  };

  const handleExport = () => {
    const config = exportMCPConfig(servers);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mcp-servers.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = importMCPConfig(text);
      
      for (const server of imported) {
        await addServer(server);
      }
      
      alert(`${imported.length}개의 서버를 가져왔습니다.`);
    } catch (error) {
      alert('설정 가져오기 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }
    
    // 파일 입력 초기화
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b border-border bg-card px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link href="/">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold truncate">MCP 서버 관리</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Model Context Protocol 서버를 관리하고 테스트합니다
              </p>
            </div>
          </div>

          <div className="flex gap-1 sm:gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleExport}
              title="내보내기"
            >
              <Download className="w-4 h-4" />
              <span className="sr-only">내보내기</span>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <label className="cursor-pointer flex items-center justify-center" title="가져오기">
                <Upload className="w-4 h-4" />
                <span className="sr-only">가져오기</span>
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </Button>

            {/* 서버 추가 버튼 */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="icon" 
                  className="shrink-0"
                  title="서버 추가"
                >
                  <Plus className="w-4 h-4" />
                  <span className="sr-only">서버 추가</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>MCP 서버 추가</DialogTitle>
                </DialogHeader>
                <MCPServerForm
                  onSubmit={handleAddServer}
                  onCancel={() => setIsAddDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 서버 목록 */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-base sm:text-lg font-semibold">서버 목록</h2>
            {servers.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                <p>등록된 서버가 없습니다.</p>
                <p className="text-sm mt-2">서버를 추가하여 시작하세요.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {servers.map((server) => (
                  <MCPServerCard
                    key={server.id}
                    server={server}
                    isConnected={isConnected(server.id)}
                    onConnect={() => connect(server.id)}
                    onDisconnect={() => disconnect(server.id)}
                    onDelete={() => deleteServer(server.id)}
                    onSelect={() => setSelectedServerId(server.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 서버 상세 */}
          <div className="lg:col-span-2">
            {selectedServer && isConnected(selectedServer.id) ? (
              <Tabs defaultValue="tools" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="tools" className="flex-1">
                    Tools ({selectedServerTools.length})
                  </TabsTrigger>
                  <TabsTrigger value="prompts" className="flex-1">
                    Prompts ({selectedServerPrompts.length})
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="flex-1">
                    Resources ({selectedServerResources.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tools" className="space-y-4 mt-4">
                  <h3 className="text-lg font-semibold">{selectedServer.name} - Tools</h3>
                  {selectedServerTools.length === 0 ? (
                    <Card className="p-6 text-center text-muted-foreground">
                      사용 가능한 Tool이 없습니다.
                    </Card>
                  ) : (
                    <MCPToolTester
                      tools={selectedServerTools}
                      onCallTool={(name, args) => callTool(selectedServer.id, name, args)}
                    />
                  )}
                </TabsContent>

                <TabsContent value="prompts" className="space-y-4 mt-4">
                  <h3 className="text-lg font-semibold">{selectedServer.name} - Prompts</h3>
                  {selectedServerPrompts.length === 0 ? (
                    <Card className="p-6 text-center text-muted-foreground">
                      사용 가능한 Prompt가 없습니다.
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {selectedServerPrompts.map((prompt) => (
                        <Card key={prompt.name} className="p-4">
                          <h4 className="font-semibold">{prompt.name}</h4>
                          {prompt.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {prompt.description}
                            </p>
                          )}
                          {prompt.arguments && prompt.arguments.length > 0 && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">인자:</span>
                              <ul className="list-disc list-inside mt-1">
                                {prompt.arguments.map((arg) => (
                                  <li key={arg.name}>
                                    {arg.name}
                                    {arg.required && ' (필수)'}
                                    {arg.description && ` - ${arg.description}`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="resources" className="space-y-4 mt-4">
                  <h3 className="text-lg font-semibold">{selectedServer.name} - Resources</h3>
                  {selectedServerResources.length === 0 ? (
                    <Card className="p-6 text-center text-muted-foreground">
                      사용 가능한 Resource가 없습니다.
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {selectedServerResources.map((resource) => (
                        <Card key={resource.uri} className="p-4">
                          <h4 className="font-semibold break-all">{resource.uri}</h4>
                          {resource.name && (
                            <p className="text-sm font-medium mt-1">{resource.name}</p>
                          )}
                          {resource.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {resource.description}
                            </p>
                          )}
                          {resource.mimeType && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Type: {resource.mimeType}
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="p-12 text-center text-muted-foreground">
                <p className="text-lg">서버를 선택하고 연결하세요</p>
                <p className="text-sm mt-2">
                  연결된 서버의 Tools, Prompts, Resources를 확인하고 테스트할 수 있습니다.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

