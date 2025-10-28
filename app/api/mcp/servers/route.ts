import { NextRequest, NextResponse } from 'next/server';
import { loadMCPServers, saveMCPServers } from '@/lib/mcp-storage';
import { MCPServerConfig } from '@/lib/types';

// GET: 저장된 서버 목록 조회
export async function GET() {
  try {
    const servers = loadMCPServers();
    return NextResponse.json({ servers });
  } catch (error) {
    console.error('Failed to load servers:', error);
    return NextResponse.json(
      { error: 'Failed to load servers' },
      { status: 500 }
    );
  }
}

// POST: 서버 추가/업데이트
export async function POST(request: NextRequest) {
  try {
    const server: MCPServerConfig = await request.json();

    // 유효성 검증
    if (!server.id || !server.name || !server.transport) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (server.transport === 'stdio' && !server.command) {
      return NextResponse.json(
        { error: 'STDIO transport requires command' },
        { status: 400 }
      );
    }

    if ((server.transport === 'http' || server.transport === 'sse') && !server.url) {
      return NextResponse.json(
        { error: `${server.transport.toUpperCase()} transport requires URL` },
        { status: 400 }
      );
    }

    const servers = loadMCPServers();
    const index = servers.findIndex((s) => s.id === server.id);

    if (index >= 0) {
      servers[index] = server;
    } else {
      servers.push(server);
    }

    saveMCPServers(servers);

    return NextResponse.json({ server });
  } catch (error) {
    console.error('Failed to save server:', error);
    return NextResponse.json(
      { error: 'Failed to save server' },
      { status: 500 }
    );
  }
}

// DELETE: 서버 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('id');

    if (!serverId) {
      return NextResponse.json(
        { error: 'Server ID is required' },
        { status: 400 }
      );
    }

    const servers = loadMCPServers();
    const filtered = servers.filter((s) => s.id !== serverId);

    saveMCPServers(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete server:', error);
    return NextResponse.json(
      { error: 'Failed to delete server' },
      { status: 500 }
    );
  }
}

