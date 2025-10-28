import { NextRequest, NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp-client-manager';

// GET: Resources 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await params;

    if (!mcpClientManager.isConnected(serverId)) {
      // 연결되지 않았어도 빈 배열 반환 (에러 대신)
      return NextResponse.json({ resources: [] });
    }

    const resources = await mcpClientManager.listResources(serverId);

    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Failed to list resources:', error);
    // 에러가 발생해도 빈 배열 반환
    return NextResponse.json({ resources: [] });
  }
}

// POST: Resource 읽기
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await params;
    const { uri } = await request.json();

    if (!uri) {
      return NextResponse.json(
        { error: 'Resource URI is required' },
        { status: 400 }
      );
    }

    if (!mcpClientManager.isConnected(serverId)) {
      return NextResponse.json(
        { error: 'Server is not connected' },
        { status: 400 }
      );
    }

    const result = await mcpClientManager.readResource(serverId, uri);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Failed to read resource:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to read resource: ${errorMessage}` },
      { status: 500 }
    );
  }
}

