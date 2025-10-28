'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  MCPServerConfig,
  MCPConnectionStatus,
  MCPTool,
  MCPPrompt,
  MCPResource,
} from '@/lib/types';
import { loadMCPServers, saveMCPServers, loadConnectedServerIds, saveConnectedServerIds } from '@/lib/mcp-storage';

interface MCPContextType {
  servers: MCPServerConfig[];
  connectionStatuses: Map<string, boolean>;
  tools: Map<string, MCPTool[]>;
  prompts: Map<string, MCPPrompt[]>;
  resources: Map<string, MCPResource[]>;
  
  // 서버 관리
  addServer: (server: MCPServerConfig) => Promise<void>;
  updateServer: (server: MCPServerConfig) => Promise<void>;
  deleteServer: (serverId: string) => Promise<void>;
  refreshServers: () => Promise<void>;
  
  // 연결 관리
  connect: (serverId: string) => Promise<void>;
  disconnect: (serverId: string) => Promise<void>;
  isConnected: (serverId: string) => boolean;
  
  // 기능 조회
  fetchTools: (serverId: string) => Promise<void>;
  fetchPrompts: (serverId: string) => Promise<void>;
  fetchResources: (serverId: string) => Promise<void>;
  
  // Tool 실행
  callTool: (serverId: string, toolName: string, args: Record<string, any>) => Promise<any>;
  
  // Prompt 가져오기
  getPrompt: (serverId: string, promptName: string, args?: Record<string, string>) => Promise<any>;
  
  // Resource 읽기
  readResource: (serverId: string, uri: string) => Promise<any>;
}

const MCPContext = createContext<MCPContextType | undefined>(undefined);

export function MCPProvider({ children }: { children: React.ReactNode }) {
  const [servers, setServers] = useState<MCPServerConfig[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<Map<string, boolean>>(new Map());
  const [tools, setTools] = useState<Map<string, MCPTool[]>>(new Map());
  const [prompts, setPrompts] = useState<Map<string, MCPPrompt[]>>(new Map());
  const [resources, setResources] = useState<Map<string, MCPResource[]>>(new Map());
  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false);

  // 초기 로드
  useEffect(() => {
    refreshServers();
  }, []);

  // 자동 재연결: servers가 로드된 후 한 번만 실행
  useEffect(() => {
    if (servers.length > 0 && !hasAttemptedReconnect) {
      setHasAttemptedReconnect(true);
      
      const connectedIds = loadConnectedServerIds();
      if (connectedIds.length > 0) {
        const reconnectPromises = connectedIds
          .filter((id) => servers.some((s) => s.id === id))
          .map((id) =>
            connect(id).catch((err) => {
              console.warn(`Auto-reconnect failed for ${id}:`, err);
            })
          );
        
        // 백그라운드에서 조용히 재연결 (UI 차단 없음)
        Promise.allSettled(reconnectPromises);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servers, hasAttemptedReconnect]);

  const refreshServers = useCallback(async () => {
    const loadedServers = loadMCPServers();
    setServers(loadedServers);
  }, []);

  const addServer = useCallback(async (server: MCPServerConfig) => {
    // localStorage에 직접 저장 (클라이언트 사이드)
    const servers = loadMCPServers();
    const index = servers.findIndex((s) => s.id === server.id);

    if (index >= 0) {
      servers[index] = server;
    } else {
      servers.push(server);
    }

    saveMCPServers(servers);
    await refreshServers();
  }, [refreshServers]);

  const updateServer = useCallback(async (server: MCPServerConfig) => {
    await addServer(server); // POST handles both add and update
  }, [addServer]);

  const deleteServer = useCallback(async (serverId: string) => {
    // 먼저 연결 해제
    if (connectionStatuses.get(serverId)) {
      await disconnect(serverId);
    }

    // localStorage에서 직접 삭제 (클라이언트 사이드)
    const servers = loadMCPServers();
    const filtered = servers.filter((s) => s.id !== serverId);
    saveMCPServers(filtered);

    // 캐시된 데이터 삭제
    setTools((prev) => {
      const newMap = new Map(prev);
      newMap.delete(serverId);
      return newMap;
    });
    setPrompts((prev) => {
      const newMap = new Map(prev);
      newMap.delete(serverId);
      return newMap;
    });
    setResources((prev) => {
      const newMap = new Map(prev);
      newMap.delete(serverId);
      return newMap;
    });

    await refreshServers();
  }, [connectionStatuses, refreshServers]);

  const connect = useCallback(async (serverId: string) => {
    // 클라이언트에서 서버 설정을 찾아서 API에 전달
    const server = servers.find((s) => s.id === serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    const response = await fetch(`/api/mcp/${serverId}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to connect');
    }

    setConnectionStatuses((prev) => {
      const newStatuses = new Map(prev).set(serverId, true);
      // localStorage에 연결된 서버 ID 목록 저장
      const connectedIds = Array.from(newStatuses.keys()).filter((id) => newStatuses.get(id));
      saveConnectedServerIds(connectedIds);
      return newStatuses;
    });

    // 연결 후 자동으로 기능 조회
    try {
      await Promise.all([
        fetchTools(serverId),
        fetchPrompts(serverId),
        fetchResources(serverId),
      ]);
    } catch (error) {
      console.error('Failed to fetch server capabilities:', error);
    }
  }, [servers]);

  const disconnect = useCallback(async (serverId: string) => {
    const response = await fetch(`/api/mcp/${serverId}/disconnect`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect');
    }

    setConnectionStatuses((prev) => {
      const newStatuses = new Map(prev);
      newStatuses.delete(serverId);
      // localStorage에 업데이트된 연결 목록 저장
      const connectedIds = Array.from(newStatuses.keys()).filter((id) => newStatuses.get(id));
      saveConnectedServerIds(connectedIds);
      return newStatuses;
    });
  }, []);

  const isConnected = useCallback(
    (serverId: string) => {
      return connectionStatuses.get(serverId) || false;
    },
    [connectionStatuses]
  );

  const fetchTools = useCallback(async (serverId: string) => {
    const response = await fetch(`/api/mcp/${serverId}/tools`);

    if (!response.ok) {
      throw new Error('Failed to fetch tools');
    }

    const data = await response.json();
    setTools((prev) => new Map(prev).set(serverId, data.tools));
  }, []);

  const fetchPrompts = useCallback(async (serverId: string) => {
    const response = await fetch(`/api/mcp/${serverId}/prompts`);

    if (!response.ok) {
      throw new Error('Failed to fetch prompts');
    }

    const data = await response.json();
    setPrompts((prev) => new Map(prev).set(serverId, data.prompts));
  }, []);

  const fetchResources = useCallback(async (serverId: string) => {
    const response = await fetch(`/api/mcp/${serverId}/resources`);

    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }

    const data = await response.json();
    setResources((prev) => new Map(prev).set(serverId, data.resources));
  }, []);

  const callTool = useCallback(async (serverId: string, toolName: string, args: Record<string, any>) => {
    const response = await fetch(`/api/mcp/${serverId}/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolName, arguments: args }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to call tool');
    }

    const data = await response.json();
    return data.result;
  }, []);

  const getPrompt = useCallback(
    async (serverId: string, promptName: string, args?: Record<string, string>) => {
      const response = await fetch(`/api/mcp/${serverId}/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptName, arguments: args }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get prompt');
      }

      const data = await response.json();
      return data.result;
    },
    []
  );

  const readResource = useCallback(async (serverId: string, uri: string) => {
    const response = await fetch(`/api/mcp/${serverId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to read resource');
    }

    const data = await response.json();
    return data.result;
  }, []);

  const value: MCPContextType = {
    servers,
    connectionStatuses,
    tools,
    prompts,
    resources,
    addServer,
    updateServer,
    deleteServer,
    refreshServers,
    connect,
    disconnect,
    isConnected,
    fetchTools,
    fetchPrompts,
    fetchResources,
    callTool,
    getPrompt,
    readResource,
  };

  return <MCPContext.Provider value={value}>{children}</MCPContext.Provider>;
}

export function useMCP() {
  const context = useContext(MCPContext);
  if (context === undefined) {
    throw new Error('useMCP must be used within an MCPProvider');
  }
  return context;
}

