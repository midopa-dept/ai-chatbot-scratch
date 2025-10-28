import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { MCPServerConfig, MCPTool, MCPPrompt, MCPResource } from './types';

// Global 타입 확장 (Next.js 서버 인스턴스 간 공유)
declare global {
  var mcpClientManagerInstance: MCPClientManager | undefined;
}

/**
 * MCP Client Manager (전역 싱글톤)
 * 여러 MCP 서버와의 연결을 관리합니다.
 * Node.js global 객체를 사용하여 서버 재시작 시에도 연결을 유지합니다.
 */
class MCPClientManager {
  private clients: Map<string, Client> = new Map();

  private constructor() {}

  static getInstance(): MCPClientManager {
    if (!global.mcpClientManagerInstance) {
      global.mcpClientManagerInstance = new MCPClientManager();
    }
    return global.mcpClientManagerInstance;
  }

  /**
   * MCP 서버에 연결합니다.
   */
  async connect(config: MCPServerConfig): Promise<void> {
    console.log(`[MCP Manager] Connecting to server: ${config.id} (${config.transport})`);
    
    // 이미 연결된 경우 먼저 연결 해제
    if (this.clients.has(config.id)) {
      console.log(`[MCP Manager] Disconnecting existing connection for ${config.id}`);
      await this.disconnect(config.id);
    }

    const client = new Client({
      name: `mcp-client-${config.id}`,
      version: '1.0.0',
    });

    let transport;

    try {
      switch (config.transport) {
        case 'stdio':
          if (!config.command) {
            throw new Error('STDIO transport requires command');
          }
          console.log(`[MCP Manager] Creating STDIO transport with command: ${config.command}, args:`, config.args);
          transport = new StdioClientTransport({
            command: config.command,
            args: config.args || [],
            env: config.env,
          });
          break;

        case 'http':
          if (!config.url) {
            throw new Error('HTTP transport requires URL');
          }
          console.log(`[MCP Manager] Creating HTTP transport with URL: ${config.url}`);
          transport = new StreamableHTTPClientTransport(new URL(config.url));
          break;

        case 'sse':
          if (!config.url) {
            throw new Error('SSE transport requires URL');
          }
          console.log(`[MCP Manager] Creating SSE transport with URL: ${config.url}`);
          transport = new SSEClientTransport(new URL(config.url));
          break;

        default:
          throw new Error(`Unsupported transport: ${config.transport}`);
      }

      console.log(`[MCP Manager] Connecting client to transport...`);
      await client.connect(transport);
      console.log(`[MCP Manager] Client connected successfully!`);
      
      this.clients.set(config.id, client);
      console.log(`[MCP Manager] Server ${config.id} registered in clients map`);
    } catch (error) {
      console.error(`[MCP Manager] Failed to connect to MCP server ${config.id}:`, error);
      throw error;
    }
  }

  /**
   * MCP 서버 연결을 해제합니다.
   */
  async disconnect(serverId: string): Promise<void> {
    const client = this.clients.get(serverId);
    if (client) {
      try {
        await client.close();
      } catch (error) {
        console.error(`Error closing client ${serverId}:`, error);
      }
      this.clients.delete(serverId);
    }
  }

  /**
   * 서버가 연결되어 있는지 확인합니다.
   */
  isConnected(serverId: string): boolean {
    return this.clients.has(serverId);
  }

  /**
   * 연결된 모든 서버 ID를 반환합니다.
   */
  getConnectedServerIds(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * 특정 서버의 Client 인스턴스를 반환합니다.
   */
  getClient(serverId: string): Client | undefined {
    return this.clients.get(serverId);
  }

  /**
   * 특정 서버의 Tools 목록을 가져옵니다.
   */
  async listTools(serverId: string): Promise<MCPTool[]> {
    console.log(`[MCP Manager] listTools called for server: ${serverId}`);
    const client = this.clients.get(serverId);
    if (!client) {
      console.error(`[MCP Manager] Server ${serverId} is not connected`);
      throw new Error(`Server ${serverId} is not connected`);
    }

    try {
      console.log(`[MCP Manager] Calling client.listTools()...`);
      const result = await client.listTools();
      console.log(`[MCP Manager] listTools result:`, result);
      const tools = result.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as Record<string, unknown>,
      }));
      console.log(`[MCP Manager] Mapped ${tools.length} tools`);
      return tools;
    } catch (error) {
      // Tools를 지원하지 않는 서버는 빈 배열 반환
      console.log(`[MCP Manager] Server ${serverId} does not support tools or returned empty list. Error:`, error);
      return [];
    }
  }

  /**
   * Tool을 실행합니다.
   */
  async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`Server ${serverId} is not connected`);
    }

    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });

    return result;
  }

  /**
   * 특정 서버의 Prompts 목록을 가져옵니다.
   */
  async listPrompts(serverId: string): Promise<MCPPrompt[]> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`Server ${serverId} is not connected`);
    }

    try {
      const result = await client.listPrompts();
      return result.prompts.map((prompt) => ({
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments?.map((arg) => ({
          name: arg.name,
          description: arg.description,
          required: arg.required,
        })),
      }));
    } catch {
      // Prompts를 지원하지 않는 서버는 빈 배열 반환
      console.log(`Server ${serverId} does not support prompts or returned empty list`);
      return [];
    }
  }

  /**
   * 특정 Prompt를 가져옵니다.
   */
  async getPrompt(
    serverId: string,
    promptName: string,
    args?: Record<string, string>
  ): Promise<unknown> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`Server ${serverId} is not connected`);
    }

    const result = await client.getPrompt({
      name: promptName,
      arguments: args,
    });

    return result;
  }

  /**
   * 특정 서버의 Resources 목록을 가져옵니다.
   */
  async listResources(serverId: string): Promise<MCPResource[]> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`Server ${serverId} is not connected`);
    }

    try {
      const result = await client.listResources();
      return result.resources.map((resource) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      }));
    } catch {
      // Resources를 지원하지 않는 서버는 빈 배열 반환
      console.log(`Server ${serverId} does not support resources or returned empty list`);
      return [];
    }
  }

  /**
   * 특정 Resource를 읽습니다.
   */
  async readResource(serverId: string, uri: string): Promise<unknown> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`Server ${serverId} is not connected`);
    }

    const result = await client.readResource({ uri });
    return result;
  }

  /**
   * 모든 연결을 해제합니다.
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map((id) =>
      this.disconnect(id)
    );
    await Promise.all(promises);
  }
}

export const mcpClientManager = MCPClientManager.getInstance();

