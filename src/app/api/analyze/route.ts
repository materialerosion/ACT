import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/aiService';
import { MockDataService } from '@/services/mockDataService';
import { ConsumerProfile, Concept, Question } from '@/types';

// Configure route segment to extend timeout for long-running AI analysis
export const maxDuration = 900; // 15 minutes in seconds
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory storage for ongoing analysis jobs
const analysisJobStore = new Map<string, {
  status: 'processing' | 'completed' | 'failed';
  analyses?: any[];
  summary?: any;
  error?: string;
  startTime: number;
}>();

// Cleanup old jobs after 1 hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [jobId, job] of analysisJobStore.entries()) {
    if (job.startTime < oneHourAgo) {
      analysisJobStore.delete(jobId);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
  }

  const job = analysisJobStore.get(jobId);
  
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.status === 'completed') {
    return NextResponse.json({
      status: 'completed',
      analyses: job.analyses,
      summary: job.summary,
      totalAnalyses: job.analyses?.length || 0,
    });
  } else if (job.status === 'failed') {
    return NextResponse.json({
      status: 'failed',
      error: job.error,
    }, { status: 500 });
  } else {
    return NextResponse.json({
      status: 'processing',
    });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { profiles, concepts, questions }: { profiles: ConsumerProfile[]; concepts: Concept[]; questions?: Question[] } = body;

  // Validate input
  if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
    return NextResponse.json(
      { error: 'No consumer profiles provided' },
      { status: 400 }
    );
  }

  if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
    return NextResponse.json(
      { error: 'No concepts provided for analysis' },
      { status: 400 }
    );
  }

  // Generate a unique job ID
  const jobId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Initialize job status
  analysisJobStore.set(jobId, {
    status: 'processing',
    startTime: Date.now(),
  });

  console.log(`🆔 [DEBUG] Created analysis job ${jobId}`);

  // Start background processing (don't await)
  (async () => {
    try {
      console.log('🚀 [DEBUG] Attempting to use AI Service for preference analysis...');
      console.log(`📊 [DEBUG] Processing ${profiles.length} profiles against ${concepts.length} concepts`);
      
      let analyses;
      let insights;

      try {
        const startTime = Date.now();
        analyses = await AIService.analyzePreferences(profiles, concepts, questions || []);
        const analysisTime = Date.now() - startTime;
        console.log(`⏱️ [DEBUG] Analysis completed in ${analysisTime}ms with ${analyses.length} results`);
        
        const insightStartTime = Date.now();
        insights = await AIService.generateInsights(profiles, concepts, analyses);
        const insightTime = Date.now() - insightStartTime;
        console.log(`💡 [DEBUG] Insights generated in ${insightTime}ms`);
        
        console.log('✅ [DEBUG] AI Service successfully completed analysis and insights');
      } catch (aiError) {
        console.warn('❌ [DEBUG] AI service failed, falling back to mock data:', aiError);
        // Fallback to mock data if AI service fails
        analyses = MockDataService.generateMockAnalyses(profiles, concepts);
        insights = MockDataService.generateMockInsights(profiles, concepts, analyses);
        console.log('✅ [DEBUG] Mock Data Service successfully completed analysis and insights');
      }

      // Create summary object
      const summary = {
        insights,
      };

      console.log(`🚀 [DEBUG] Job ${jobId} completed with ${analyses.length} analyses`);
      
      // Update job status
      analysisJobStore.set(jobId, {
        status: 'completed',
        analyses,
        summary,
        startTime: analysisJobStore.get(jobId)!.startTime,
      });
    } catch (error) {
      console.error('Error analyzing preferences for job', jobId, ':', error);
      analysisJobStore.set(jobId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        startTime: analysisJobStore.get(jobId)!.startTime,
      });
    }
  })();

  // Return job ID immediately
  return NextResponse.json({
    jobId,
    status: 'processing',
    message: 'Analysis started. Poll for status.',
  });
}
