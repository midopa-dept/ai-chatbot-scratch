import { NextRequest, NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client-manager';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ serverId: string }> }
) {
  try {
    await context.params; // params를 사용하여 validation
    const { server } = await request.json();

    if (!server) {
      return NextResponse.json(
        { error: 'Server configuration is required' },
        { status: 400 }
      );
    }

    console.log('[MCP Connect] Connecting to server:', server.id, server.name);
    await mcpClientManager.connect(server);
    console.log('[MCP Connect] Connected successfully');

    // 연결 후 바로 Tools 확인
    try {
      const tools = await mcpClientManager.listTools(server.id);
      console.log('[MCP Connect] Tools count:', tools.length);
    } catch (error) {
      console.error('[MCP Connect] Failed to list tools immediately after connect:', error);
    }

    return NextResponse.json({ success: true, connected: true });
  } catch (error) {
    console.error('Failed to connect to server:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to connect: ${errorMessage}`, connected: false },
      { status: 500 }
    );
  }
}

