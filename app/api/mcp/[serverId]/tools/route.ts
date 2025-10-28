import { NextRequest, NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client-manager';

// GET: Tools 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await params;

    if (!mcpClientManager.isConnected(serverId)) {
      // 연결되지 않았어도 빈 배열 반환 (에러 대신)
      return NextResponse.json({ tools: [] });
    }

    const tools = await mcpClientManager.listTools(serverId);

    return NextResponse.json({ tools });
  } catch (error) {
    console.error('Failed to list tools:', error);
    // 에러가 발생해도 빈 배열 반환
    return NextResponse.json({ tools: [] });
  }
}

// POST: Tool 실행
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await params;
    const { toolName, arguments: args } = await request.json();

    if (!toolName) {
      return NextResponse.json(
        { error: 'Tool name is required' },
        { status: 400 }
      );
    }

    if (!mcpClientManager.isConnected(serverId)) {
      return NextResponse.json(
        { error: 'Server is not connected' },
        { status: 400 }
      );
    }

    const result = await mcpClientManager.callTool(serverId, toolName, args || {});

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Failed to call tool:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to call tool: ${errorMessage}` },
      { status: 500 }
    );
  }
}

