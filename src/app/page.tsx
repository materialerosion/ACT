'use client';

import React, { useState } from 'react';
import { DemographicInput, ConsumerProfile, Concept, AnalysisReport, PreferenceAnalysis } from '@/types';
import DemographicForm from '@/components/DemographicForm';
import ParticipantReview from '@/components/ParticipantReview';
import ConceptsForm from '@/components/ConceptsForm';
import Analytics from '@/components/Analytics';
import ReportDownload from '@/components/ReportDownload';
import LoadingBar from '@/components/LoadingBar';
import { Brain, Users, Target, BarChart3, Download } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type Step = 'demographics' | 'review' | 'concepts' | 'analysis' | 'results';

// Configuration - easily adjustable timeout settings
const ANALYSIS_TIMEOUT_SECONDS = 600; // 10 minutes - adjust this value as needed

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('demographics');
  const [demographics, setDemographics] = useState<DemographicInput | null>(null);
  const [profiles, setProfiles] = useState<ConsumerProfile[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');

  const pollJobStatus = async (jobId: string): Promise<ConsumerProfile[]> => {
    const maxAttempts = 120; // Poll for up to 10 minutes (120 * 5 seconds)
    const pollIntervalMs = 5000; // Poll every 5 seconds
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/profiles/generate?jobId=${jobId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          console.log('✅ [DEBUG] Job completed successfully');
          return data.profiles;
        } else if (data.status === 'failed') {
          throw new Error(data.error || 'Profile generation failed');
        }

        // Still processing, update progress
        const estimatedProgress = Math.min(90, 10 + (attempts / maxAttempts) * 80);
        setLoadingProgress(estimatedProgress);
        
        console.log(`🔄 [DEBUG] Polling attempt ${attempts + 1}/${maxAttempts} - Status: processing`);
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        attempts++;
      } catch (error) {
        console.error('Error polling job status:', error);
        throw error;
      }
    }

    throw new Error('Profile generation timed out after 10 minutes. Please try again with fewer profiles.');
  };

  const handleDemographicsSubmit = async (demographicData: DemographicInput) => {
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingMessage('Recruiting Consumer Profiles');
    setDemographics(demographicData);

    try {
      console.log('🚀 [DEBUG] Sending request to /api/profiles/generate', {
        demographics: demographicData,
        count: demographicData.consumerCount,
      });

      // Start the job
      const response = await fetch('/api/profiles/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          demographics: demographicData,
          count: demographicData.consumerCount,
        }),
      });

      console.log('📡 [DEBUG] API Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Failed to start profile generation: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const jobId = data.jobId;

      console.log(`🔄 [DEBUG] Job started with ID: ${jobId}, polling for completion...`);
      setLoadingMessage('Generating profiles in background... This may take a few minutes.');

      // Poll for job completion
      const profiles = await pollJobStatus(jobId);

      setLoadingProgress(100);
      setLoadingMessage('Recruitment Complete');
      
      setProfiles(profiles);
      
      // Small delay to show completion
      setTimeout(() => {
        setCurrentStep('review');
      }, 500);
    } catch (error) {
      console.error('Error recruiting profiles:', error);
      alert('Failed to recruit consumer profiles. Please try again.');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
        setLoadingMessage('');
      }, 500);
    }
  };

  const pollAnalysisStatus = async (jobId: string): Promise<{ analyses: any[], summary: any }> => {
    const maxAttempts = 120; // Poll for up to 10 minutes (120 * 5 seconds)
    const pollIntervalMs = 5000; // Poll every 5 seconds
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/analyze?jobId=${jobId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          console.log('✅ [DEBUG] Analysis job completed successfully');
          return { analyses: data.analyses, summary: data.summary };
        } else if (data.status === 'failed') {
          throw new Error(data.error || 'Analysis failed');
        }

        // Still processing, update progress
        const estimatedProgress = Math.min(90, 10 + (attempts / maxAttempts) * 80);
        setLoadingProgress(estimatedProgress);
        
        console.log(`🔄 [DEBUG] Polling analysis attempt ${attempts + 1}/${maxAttempts} - Status: processing`);
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        attempts++;
      } catch (error) {
        console.error('Error polling analysis status:', error);
        throw error;
      }
    }

    throw new Error('Analysis timed out after 10 minutes. Please try again with fewer profiles or concepts.');
  };

  const handleConceptsSubmit = async (conceptsData: Concept[]) => {
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingMessage('Analyzing Consumer Preferences');
    setConcepts(conceptsData);
    setCurrentStep('analysis');

    try {
      console.log('🚀 [DEBUG] Sending request to /api/analyze');

      // Start the analysis job
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profiles,
          concepts: conceptsData,
        }),
      });

      console.log('📡 [DEBUG] API Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Failed to start analysis: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const jobId = data.jobId;

      console.log(`🔄 [DEBUG] Analysis job started with ID: ${jobId}, polling for completion...`);
      setLoadingMessage('Analyzing preferences in background... This may take a few minutes.');

      // Poll for job completion
      const result = await pollAnalysisStatus(jobId);

      setLoadingProgress(100);
      setLoadingMessage('Analysis Complete');

      // Create the complete analysis report
      const report: AnalysisReport = {
        id: uuidv4(),
        timestamp: new Date(),
        demographics: demographics!,
        concepts: conceptsData,
        profiles,
        analyses: result.analyses,
        summary: result.summary,
      };

      setAnalysisReport(report);
      
      setTimeout(() => {
        setCurrentStep('results');
      }, 500);
    } catch (error) {
      console.error('Error analyzing preferences:', error);
      
      if (error instanceof Error) {
        alert(`Failed to analyze consumer preferences: ${error.message}. Please try again.`);
      } else {
        alert('Failed to analyze consumer preferences. Please try again.');
      }
      setCurrentStep('concepts');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
        setLoadingMessage('');
      }, 500);
    }
  };

  const handleProfilesUpdate = (updatedProfiles: ConsumerProfile[]) => {
    setProfiles(updatedProfiles);
  };

  const handleReviewContinue = () => {
    setCurrentStep('concepts');
  };

  const resetAnalysis = () => {
    setCurrentStep('demographics');
    setDemographics(null);
    setProfiles([]);
    setConcepts([]);
    setAnalysisReport(null);
  };

  const stepIcons = {
    demographics: Users,
    review: Users,
    concepts: Target,
    analysis: Brain,
    results: BarChart3,
  };

  const stepTitles = {
    demographics: 'Recruit Consumers',
    review: 'Review Participants',
    concepts: 'Add Concepts',
    analysis: 'Analyzing...',
    results: 'View Results',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Brain className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Consumer Profile Analyzer</h1>
                <p className="text-sm text-gray-600">AI-powered consumer recruitment and preference analysis</p>
              </div>
            </div>
            {analysisReport && (
              <button
                onClick={resetAnalysis}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                New Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center space-x-8">
          {Object.entries(stepTitles).map(([step, title], index) => {
            const Icon = stepIcons[step as Step];
            const isActive = currentStep === step;
            const isCompleted = ['demographics', 'review', 'concepts', 'analysis'].indexOf(currentStep) > index;
            
            return (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive 
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : isCompleted 
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {title}
                </span>
                {index < Object.keys(stepTitles).length - 1 && (
                  <div className={`ml-4 w-8 h-0.5 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {currentStep === 'demographics' && (
          <DemographicForm 
            onSubmit={handleDemographicsSubmit} 
            isLoading={isLoading}
            loadingProgress={loadingProgress}
            loadingMessage={loadingMessage}
          />
        )}

        {currentStep === 'review' && demographics && (
          <ParticipantReview 
            profiles={profiles}
            demographics={demographics}
            onProfilesUpdate={handleProfilesUpdate}
            onContinue={handleReviewContinue}
          />
        )}

        {currentStep === 'concepts' && (
          <ConceptsForm onSubmit={handleConceptsSubmit} isLoading={isLoading} />
        )}

        {currentStep === 'analysis' && (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingBar 
              progress={loadingProgress}
              message={loadingMessage}
              subMessage={`Analyzing ${profiles.length} consumer profiles against ${concepts.length} concepts`}
            />
          </div>
        )}

        {currentStep === 'results' && analysisReport && (
          <div className="space-y-8">
            <Analytics report={analysisReport} />
            <ReportDownload report={analysisReport} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Consumer Profile Analyzer. Powered by myGenAssist. <br /> AI-generated content may contain inaccuracies. Please verify all information before use.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
