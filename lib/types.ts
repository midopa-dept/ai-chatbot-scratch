export type MessageRole = 'user' | 'assistant';

export interface ToolCall {
  server: string;
  tool: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

// Chat Session Types
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// Chat API Request Types
export interface ChatRequest {
  messages: Message[];
  enabledServerIds?: string[];
}

// MCP Types
export type MCPTransportType = 'stdio' | 'sse' | 'http';

export interface MCPServerConfig {
  id: string;
  name: string;
  transport: MCPTransportType;
  // STDIO
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  // HTTP/SSE
  url?: string;
}

export interface MCPConnectionStatus {
  serverId: string;
  connected: boolean;
  error?: string;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface MCPResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

