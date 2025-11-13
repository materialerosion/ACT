import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/aiService';
import { MockDataService } from '@/services/mockDataService';
import { DemographicInput } from '@/types';

// In-memory storage for ongoing jobs (in production, use Redis or a database)
const jobStore = new Map<string, {
  status: 'processing' | 'completed' | 'failed';
  profiles?: any[];
  error?: string;
  startTime: number;
}>();

// Cleanup old jobs after 1 hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [jobId, job] of jobStore.entries()) {
    if (job.startTime < oneHourAgo) {
      jobStore.delete(jobId);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
  }

  const job = jobStore.get(jobId);
  
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.status === 'completed') {
    return NextResponse.json({
      status: 'completed',
      profiles: job.profiles,
      count: job.profiles?.length || 0,
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
  const { demographics, count = 100 }: { demographics: DemographicInput; count?: number } = body;

  // Validate input
  if (!demographics || !demographics.ageRanges || !demographics.ageRanges.length || !demographics.genders.length) {
    return NextResponse.json(
      { error: 'Invalid demographic data provided' },
      { status: 400 }
    );
  }

  // Generate a unique job ID
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Initialize job status
  jobStore.set(jobId, {
    status: 'processing',
    startTime: Date.now(),
  });

  console.log(`🆔 [DEBUG] Created job ${jobId} for profile generation`);

  // Start background processing (don't await)
  (async () => {
    try {
      console.log('📥 [DEBUG] API route received request');
      console.log('📝 [DEBUG] Request body parsed:', { demographics, count });

      let profiles;
      
      try {
        // Try to use AI service first
        console.log('🚀 [DEBUG] Attempting to use AI Service for profile generation...');
        profiles = await AIService.generateConsumerProfiles(demographics, count);
        console.log('✅ [DEBUG] AI Service successfully generated profiles');
      } catch (aiError) {
        console.warn('❌ [DEBUG] AI service failed, falling back to mock data:', aiError);
        // Fallback to mock data if AI service fails
        profiles = MockDataService.generateMockProfiles(demographics, count);
        console.log('✅ [DEBUG] Mock Data Service successfully generated profiles');
      }

      // Validate profiles have required fields
      const validProfiles = profiles.filter(profile => 
        profile.id && profile.name && profile.age && profile.gender
      );
      
      if (validProfiles.length !== profiles.length) {
        console.warn(`⚠️ [DEBUG] ${profiles.length - validProfiles.length} profiles missing required fields`);
      }

      console.log('📤 [DEBUG] Job', jobId, 'completed with', validProfiles.length, 'profiles');
      
      // Update job status
      jobStore.set(jobId, {
        status: 'completed',
        profiles: validProfiles,
        startTime: jobStore.get(jobId)!.startTime,
      });
    } catch (error) {
      console.error('Error generating profiles for job', jobId, ':', error);
      jobStore.set(jobId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        startTime: jobStore.get(jobId)!.startTime,
      });
    }
  })();

  // Return job ID immediately
  return NextResponse.json({
    jobId,
    status: 'processing',
    message: 'Profile generation started. Poll for status.',
  });
}
