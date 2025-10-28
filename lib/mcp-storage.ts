import { MCPServerConfig } from './types';

const MCP_SERVERS_KEY = 'mcp-servers';
const CONNECTED_SERVERS_KEY = 'mcp-connected-servers';

/**
 * localStorage에 MCP 서버 설정을 저장합니다.
 */
export function saveMCPServers(servers: MCPServerConfig[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(MCP_SERVERS_KEY, JSON.stringify(servers));
  } catch (error) {
    console.error('Failed to save MCP servers:', error);
  }
}

/**
 * localStorage에서 MCP 서버 설정을 불러옵니다.
 */
export function loadMCPServers(): MCPServerConfig[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(MCP_SERVERS_KEY);
    if (!stored) return [];

    return JSON.parse(stored) as MCPServerConfig[];
  } catch (error) {
    console.error('Failed to load MCP servers:', error);
    return [];
  }
}

/**
 * MCP 서버 설정을 JSON으로 내보냅니다.
 */
export function exportMCPConfig(servers: MCPServerConfig[]): string {
  return JSON.stringify(servers, null, 2);
}

/**
 * JSON 문자열에서 MCP 서버 설정을 가져옵니다.
 */
export function importMCPConfig(json: string): MCPServerConfig[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid format: expected array');
    }
    return parsed as MCPServerConfig[];
  } catch (error) {
    console.error('Failed to import MCP config:', error);
    throw error;
  }
}

/**
 * localStorage에서 MCP 서버 설정을 삭제합니다.
 */
export function clearMCPServers(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(MCP_SERVERS_KEY);
  } catch (error) {
    console.error('Failed to clear MCP servers:', error);
  }
}

/**
 * localStorage에 연결된 서버 ID 목록을 저장합니다.
 */
export function saveConnectedServerIds(serverIds: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CONNECTED_SERVERS_KEY, JSON.stringify(serverIds));
  } catch (error) {
    console.error('Failed to save connected servers:', error);
  }
}

/**
 * localStorage에서 연결된 서버 ID 목록을 불러옵니다.
 */
export function loadConnectedServerIds(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(CONNECTED_SERVERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load connected servers:', error);
    return [];
  }
}

