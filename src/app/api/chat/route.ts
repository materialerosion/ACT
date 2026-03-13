import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/aiService';
import { ConsumerProfile, SurveyContext, ChatMode } from '@/types';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      personaProfile,
      surveyContext,
      conversationHistory,
    }: {
      message: string;
      personaProfile: ConsumerProfile;
      surveyContext: SurveyContext;
      conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
      mode: ChatMode;
    } = body;

    if (!message || !personaProfile) {
      return NextResponse.json(
        { error: 'Missing required fields: message, personaProfile' },
        { status: 400 }
      );
    }

    const response = await AIService.chatWithPersona(
      message,
      personaProfile,
      surveyContext,
      conversationHistory || []
    );

    return NextResponse.json({
      response,
      personaId: personaProfile.id,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 }
    );
  }
}
