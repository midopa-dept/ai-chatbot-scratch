import { GoogleGenAI, mcpToTool } from '@google/genai';
import { NextRequest } from 'next/server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { mcpClientManager } from '@/lib/mcp-client-manager';
import { ChatRequest } from '@/lib/types';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, enabledServerIds } = (await request.json()) as ChatRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
      return new Response(
        JSON.stringify({ 
          error: 'GEMINI_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하고 개발 서버를 재시작하세요.' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 활성화된 MCP 서버의 Client 수집
    const activeServerIds = enabledServerIds && enabledServerIds.length > 0
      ? enabledServerIds
      : mcpClientManager.getConnectedServerIds(); // 기본: 모든 연결된 서버
    
    console.log('[Chat API] Active server IDs:', activeServerIds);
    
    const mcpClients: Client[] = [];
    for (const serverId of activeServerIds) {
      const client = mcpClientManager.getClient(serverId);
      if (client) {
        mcpClients.push(client);
        console.log(`[Chat API] Added MCP client for server: ${serverId}`);
      } else {
        console.warn(`[Chat API] Server ${serverId} is not connected`);
      }
    }
    
    console.log(`[Chat API] Total MCP clients: ${mcpClients.length}`);

    // Message[] 형식을 Gemini의 Content[] 형식으로 변환
    const contents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // 스트리밍 응답 생성
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Gemini 호출 (mcpToTool 사용)
          const baseConfig = {
            maxOutputTokens: 2048,
            temperature: 0.7,
          };

          // MCP 클라이언트가 있으면 tools 추가
          const config = mcpClients.length > 0
            ? {
                ...baseConfig,
                // @ts-expect-error - mcpToTool의 타입 시그니처가 배열 spread를 완전히 지원하지 않음
                tools: [mcpToTool(...mcpClients)],
              }
            : baseConfig;

          const response = await ai.models.generateContentStream({
            model: 'gemini-2.0-flash-001',
            contents: contents,
            config,
          });

          // mcpToTool을 사용하면 SDK가 자동으로 Function Calling을 처리합니다.
          // 우리는 응답만 스트리밍하면 됩니다.
          for await (const chunk of response) {
            // 텍스트 스트리밍
            if (chunk.text) {
              const data = encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
              controller.enqueue(data);
            }

            // Function Call 정보가 있으면 UI에 표시용으로 전달
            // mcpToTool이 자동으로 실행하므로 우리는 정보만 추출
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
              for (const fc of chunk.functionCalls) {
                // Function Call 이름 파싱 (MCP SDK가 자동으로 prefix를 추가할 수 있음)
                const toolName = fc.name || 'unknown';
                
                const toolCallInfo = encoder.encode(
                  `data: ${JSON.stringify({ 
                    toolCall: { 
                      server: 'mcp', // mcpToTool이 자동 관리
                      tool: toolName, 
                      args: fc.args || {} 
                    } 
                  })}\n\n`
                );
                controller.enqueue(toolCallInfo);
              }
            }
          }

          // 스트림 종료 신호
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
