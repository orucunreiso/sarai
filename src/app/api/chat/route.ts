import { NextRequest, NextResponse } from 'next/server';
import { getGeminiResponse, analyzeQuestionImage } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, imageBase64, hasImage } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          error: 'Message is required',
        },
        { status: 400 },
      );
    }

    console.log('🚀 API Route - Processing message:', message.slice(0, 50) + '...');
    console.log('🔍 API Route - Conversation history length:', conversationHistory?.length || 0);
    console.log('📸 API Route - Has image:', !!hasImage);

    let response: string;

    if (hasImage && imageBase64) {
      console.log('📷 Processing image with Gemini...');
      response = await analyzeQuestionImage(imageBase64);
    } else {
      response = await getGeminiResponse(message, conversationHistory || '');
    }

    console.log('✅ API Route - Response generated successfully');

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ API Route error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Sarai AI Chat API is running',
    status: 'OK',
  });
}
