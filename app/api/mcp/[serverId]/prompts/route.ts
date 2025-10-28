import { NextRequest, NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client-manager';

// GET: Prompts 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await params;

    if (!mcpClientManager.isConnected(serverId)) {
      // 연결되지 않았어도 빈 배열 반환 (에러 대신)
      return NextResponse.json({ prompts: [] });
    }

    const prompts = await mcpClientManager.listPrompts(serverId);

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Failed to list prompts:', error);
    // 에러가 발생해도 빈 배열 반환
    return NextResponse.json({ prompts: [] });
  }
}

// POST: Prompt 가져오기
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await params;
    const { promptName, arguments: args } = await request.json();

    if (!promptName) {
      return NextResponse.json(
        { error: 'Prompt name is required' },
        { status: 400 }
      );
    }

    if (!mcpClientManager.isConnected(serverId)) {
      return NextResponse.json(
        { error: 'Server is not connected' },
        { status: 400 }
      );
    }

    const result = await mcpClientManager.getPrompt(serverId, promptName, args);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Failed to get prompt:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to get prompt: ${errorMessage}` },
      { status: 500 }
    );
  }
}

