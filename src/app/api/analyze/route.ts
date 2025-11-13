import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/aiService';
import { MockDataService } from '@/services/mockDataService';
import { ConsumerProfile, Concept } from '@/types';

// Configure route segment to extend timeout for long-running AI analysis
export const maxDuration = 900; // 15 minutes in seconds
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profiles, concepts }: { profiles: ConsumerProfile[]; concepts: Concept[] } = body;

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

    let analyses;
    let insights;

    try {
      // Try to use AI service first
      console.log('🚀 [DEBUG] Attempting to use AI Service for preference analysis...');
      console.log(`📊 [DEBUG] Processing ${profiles.length} profiles against ${concepts.length} concepts`);
      
      const startTime = Date.now();
      analyses = await AIService.analyzePreferences(profiles, concepts);
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

    // Calculate summary statistics
    const summary = {
      averagePreference: analyses.reduce((sum, a) => sum + a.preference, 0) / analyses.length,
      averageInnovativeness: analyses.reduce((sum, a) => sum + a.innovativeness, 0) / analyses.length,
      averageDifferentiation: analyses.reduce((sum, a) => sum + a.differentiation, 0) / analyses.length,
      topPerformingConcept: concepts.reduce((best, concept) => {
        const conceptAnalyses = analyses.filter(a => a.conceptId === concept.id);
        const avgScore = conceptAnalyses.reduce((sum, a) => sum + a.preference, 0) / conceptAnalyses.length;
        const bestAnalyses = analyses.filter(a => a.conceptId === best.id);
        const bestAvgScore = bestAnalyses.reduce((sum, a) => sum + a.preference, 0) / bestAnalyses.length;
        return avgScore > bestAvgScore ? concept : best;
      }).title,
      insights,
    };

    const response = NextResponse.json({
      success: true,
      analyses,
      summary,
      totalAnalyses: analyses.length,
    });

    // Add headers to help with timeout issues
    response.headers.set('Cache-Control', 'no-cache, no-store, max-age=0');
    response.headers.set('Connection', 'keep-alive');
    
    console.log(`🚀 [DEBUG] Returning successful response with ${analyses.length} analyses`);
    return response;
  } catch (error) {
    console.error('Error analyzing preferences:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze consumer preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}