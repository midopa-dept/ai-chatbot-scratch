import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Gemini를 사용하여 짧은 제목 생성
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: `다음 메시지를 기반으로 채팅방 제목을 생성해주세요. 제목은 5단어 이내로 간결하게 작성하고, 이모지를 포함하지 마세요. 제목만 답변하세요.

메시지: "${message}"

제목:`,
      config: {
        maxOutputTokens: 50,
        temperature: 0.7,
      },
    });

    let title = response.text?.trim() || '새 채팅';

    // 따옴표 제거
    title = title.replace(/^["']|["']$/g, '');

    // 너무 긴 경우 자르기
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Failed to generate title:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    );
  }
}

