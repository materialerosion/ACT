import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/aiService';
import { MockDataService } from '@/services/mockDataService';
import { DemographicInput } from '@/types';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 [DEBUG] API route received request');
    const body = await request.json();
    console.log('📝 [DEBUG] Request body parsed:', body);
    const { demographics, count = 100 }: { demographics: DemographicInput; count?: number } = body;

    // Validate input
    if (!demographics || !demographics.ageRanges || !demographics.ageRanges.length || !demographics.genders.length) {
      return NextResponse.json(
        { error: 'Invalid demographic data provided' },
        { status: 400 }
      );
    }

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

    console.log('📤 [DEBUG] Returning successful response with', validProfiles.length, 'profiles');
    return NextResponse.json({
      success: true,
      profiles: validProfiles,
      count: validProfiles.length,
    });
  } catch (error) {
    console.error('Error generating profiles:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate consumer profiles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}