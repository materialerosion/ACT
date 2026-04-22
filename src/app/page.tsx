'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DemographicInput, ConsumerProfile, Concept, AnalysisReport, PreferenceAnalysis, Question } from '@/types';
import DemographicForm from '@/components/DemographicForm';
import ParticipantReview from '@/components/ParticipantReview';
import DesignSurvey from '@/components/DesignSurvey';
import Analytics from '@/components/Analytics';
import ReportDownload from '@/components/ReportDownload';
import PersonaChat from '@/components/PersonaChat';
import LoadingBar from '@/components/LoadingBar';
import { Brain, Users, Target, BarChart3, MessageCircle, LogIn, LogOut, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';

type Step = 'login' | 'demographics' | 'review' | 'design' | 'analysis' | 'results' | 'insights';

const STEPS_ORDER: Step[] = ['login', 'demographics', 'review', 'design', 'analysis', 'results', 'insights'];

// Configuration - easily adjustable timeout settings
const ANALYSIS_TIMEOUT_SECONDS = 600; // 10 minutes - adjust this value as needed

import { InteractionStatus } from '@azure/msal-browser';

export default function Home() {
  const { isAuthenticated, login, logout, inProgress } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('login');
  const [demographics, setDemographics] = useState<DemographicInput | null>(null);
  const [profiles, setProfiles] = useState<ConsumerProfile[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Navigation state: track visited steps and history for back/forward
  const [visitedSteps, setVisitedSteps] = useState<Set<Step>>(new Set(['login']));
  const [stepHistory, setStepHistory] = useState<Step[]>(['login']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Ref to track the highest step reached (for progress indicator)
  const highestStepRef = useRef(0);

  // Navigate to a step. isNewForwardAction=true means a new progression (truncates forward history).
  // isNewForwardAction=false means navigating within existing history (back/forward/click).
  const navigateToStep = useCallback((step: Step, isNewForwardAction = true) => {
    if (isNewForwardAction) {
      // Truncate any forward history and push new step
      setStepHistory(prev => {
        const newHistory = [...prev.slice(0, historyIndex + 1), step];
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    }
    setVisitedSteps(prev => new Set([...prev, step]));
    setCurrentStep(step);

    // Track highest step reached
    const stepIdx = STEPS_ORDER.indexOf(step);
    if (stepIdx > highestStepRef.current) {
      highestStepRef.current = stepIdx;
    }
  }, [historyIndex]);

  const canGoBack = useCallback(() => {
    return historyIndex > 0 && currentStep !== 'login' && !isLoading;
  }, [historyIndex, currentStep, isLoading]);

  const canGoForward = useCallback(() => {
    return historyIndex < stepHistory.length - 1 && !isLoading;
  }, [historyIndex, stepHistory.length, isLoading]);

  const goBack = useCallback(() => {
    if (!canGoBack()) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setCurrentStep(stepHistory[newIndex]);
  }, [canGoBack, historyIndex, stepHistory]);

  const goForward = useCallback(() => {
    if (!canGoForward()) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setCurrentStep(stepHistory[newIndex]);
  }, [canGoForward, historyIndex, stepHistory]);

  // Navigate to a specific step by clicking the progress indicator
  const navigateToStepDirect = useCallback((targetStep: Step) => {
    if (isLoading) return;
    if (targetStep === currentStep) return;

    const targetIdx = STEPS_ORDER.indexOf(targetStep);
    const currentIdx = STEPS_ORDER.indexOf(currentStep);

    // Only allow navigating to visited steps (not future unvisited ones)
    if (!visitedSteps.has(targetStep)) return;
    // Don't allow navigating to the transient 'analysis' step
    if (targetStep === 'analysis') return;

    // Check if this step exists in forward history
    const historyTargetIdx = stepHistory.indexOf(targetStep);
    if (historyTargetIdx !== -1 && historyTargetIdx !== historyIndex) {
      // Navigate within history
      setHistoryIndex(historyTargetIdx);
      setCurrentStep(targetStep);
    } else {
      // Push as new navigation
      navigateToStep(targetStep, true);
    }
  }, [isLoading, currentStep, visitedSteps, stepHistory, historyIndex, navigateToStep]);

  useEffect(() => {
    if (isAuthenticated) {
      if (currentStep === 'login') {
        navigateToStep('demographics', true);
      }
    } else {
      setCurrentStep('login');
      setVisitedSteps(new Set(['login']));
      setStepHistory(['login']);
      setHistoryIndex(0);
      highestStepRef.current = 0;
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps


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

    // Clear downstream state since we're re-generating profiles
    setConcepts([]);
    setQuestions([]);
    setAnalysisReport(null);
    // Remove downstream steps from visited so they remount fresh
    setVisitedSteps(prev => {
      const next = new Set(prev);
      next.delete('design');
      next.delete('analysis');
      next.delete('results');
      next.delete('insights');
      return next;
    });

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
        navigateToStep('review', true);
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

  const handleDesignSurveySubmit = async (conceptsData: Concept[], questionsData: Question[]) => {
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingMessage('Analyzing Consumer Preferences');
    setConcepts(conceptsData);
    setQuestions(questionsData);

    // Clear downstream results since we're re-analyzing
    setAnalysisReport(null);
    setVisitedSteps(prev => {
      const next = new Set(prev);
      next.delete('results');
      next.delete('insights');
      return next;
    });

    navigateToStep('analysis', true);

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
          questions: questionsData,
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
        questions: questionsData,
      };

      setAnalysisReport(report);
      
      setTimeout(() => {
        navigateToStep('results', true);
      }, 500);
    } catch (error) {
      console.error('Error analyzing preferences:', error);
      
      if (error instanceof Error) {
        alert(`Failed to analyze consumer preferences: ${error.message}. Please try again.`);
      } else {
        alert('Failed to analyze consumer preferences. Please try again.');
      }
      // Go back to design step on error
      navigateToStep('design', false);
      // Remove analysis from history since it failed
      setStepHistory(prev => prev.filter(s => s !== 'analysis'));
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

  const handleUsePresetPersonas = (presetProfiles: ConsumerProfile[]) => {
    // Set profiles directly from presets — skip AI generation
    setProfiles(presetProfiles);

    // Set a minimal demographics object so the review step renders
    // (ParticipantReview requires demographics to be non-null)
    if (!demographics) {
      setDemographics({
        ageRanges: [],
        genders: [],
        locations: [],
        incomeRanges: [],
        educationLevels: [],
        consumerCount: presetProfiles.length,
      });
    }

    // Clear downstream state since we're starting fresh with preset profiles
    setConcepts([]);
    setQuestions([]);
    setAnalysisReport(null);
    setVisitedSteps(prev => {
      const next = new Set(prev);
      next.delete('design');
      next.delete('analysis');
      next.delete('results');
      next.delete('insights');
      return next;
    });

    // Navigate to review step
    navigateToStep('review', true);
  };

  const handleReviewContinue = () => {
    navigateToStep('design', true);
  };

  const handleSkipToInterviews = () => {
    // Create a minimal AnalysisReport so PersonaChat can work with profiles
    const minimalReport: AnalysisReport = {
      id: uuidv4(),
      timestamp: new Date(),
      demographics: demographics!,
      concepts: [],
      profiles,
      analyses: [],
      summary: { insights: [] },
      questions: [],
    };
    setAnalysisReport(minimalReport);
    navigateToStep('insights', true);
  };

  const resetAnalysis = () => {
    setDemographics(null);
    setProfiles([]);
    setConcepts([]);
    setQuestions([]);
    setAnalysisReport(null);
    // Reset navigation state — go to demographics fresh
    const initialSteps: Step[] = ['login', 'demographics'];
    setVisitedSteps(new Set(initialSteps));
    setStepHistory(initialSteps);
    setHistoryIndex(1);
    setCurrentStep('demographics');
    highestStepRef.current = 1;
  };

  const stepIcons = {
    login: LogIn,
    demographics: Users,
    review: Users,
    design: Target,
    analysis: Brain,
    results: BarChart3,
    insights: MessageCircle,
  };

  const stepTitles = {
    login: 'Login',
    demographics: 'Recruit Consumers',
    review: 'Review Participants',
    design: 'Design Survey',
    analysis: 'Analyzing...',
    results: 'View Results',
    insights: 'Insights & Export',
  };

  // Determine the highest step index reached for progress indicator coloring
  const currentStepIndex = STEPS_ORDER.indexOf(currentStep);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Brain className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PULSE</h1>
                <p className="text-sm text-gray-600">AI-powered consumer recruitment and preference analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {analysisReport && (
                <button
                  onClick={resetAnalysis}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  New Analysis
                </button>
              )}
              {isAuthenticated && (
                <button
                  onClick={() => logout()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center space-x-8">
          {Object.entries(stepTitles).map(([step, title], index) => {
            const Icon = stepIcons[step as Step];
            const isActive = currentStep === step;
            const isCompleted = currentStepIndex > index;
            const isVisited = visitedSteps.has(step as Step);
            const isClickable = isVisited && !isActive && !isLoading && step !== 'analysis' && step !== 'login';
            
            return (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center ${isClickable ? 'cursor-pointer group' : ''}`}
                  onClick={() => isClickable ? navigateToStepDirect(step as Step) : null}
                  title={isClickable ? `Go to ${title}` : undefined}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    isActive 
                      ? 'border-blue-600 bg-blue-600 text-white' 
                      : isCompleted 
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                  } ${isClickable ? 'group-hover:ring-2 group-hover:ring-blue-300 group-hover:ring-offset-1' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  } ${isClickable ? 'group-hover:underline' : ''}`}>
                    {title}
                  </span>
                </div>
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

      {/* Back/Forward Navigation */}
      {currentStep !== 'login' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="flex justify-between items-center">
            <button
              onClick={goBack}
              disabled={!canGoBack()}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors flex items-center gap-2 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-3">
              {currentStep === 'results' && analysisReport && (
                <button
                  onClick={() => navigateToStep('insights', true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Insights &amp; Export
                </button>
              )}
              <button
                onClick={goForward}
                disabled={!canGoForward()}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors flex items-center gap-2 shadow-sm"
              >
                Forward
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">

        {/* Login - always conditional (no state to preserve) */}
        {currentStep === 'login' && (
            <div className="flex flex-col items-center justify-center py-20">
                {inProgress !== InteractionStatus.None ? (
                    <p>Login in progress...</p>
                ) : (
                    <button onClick={() => login()} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Login
                    </button>
                )}
            </div>
        )}

        {/* Demographics - keep mounted once visited to preserve form state */}
        <div style={{ display: currentStep === 'demographics' ? 'block' : 'none' }}>
          {visitedSteps.has('demographics') && (
            <DemographicForm
              onSubmit={handleDemographicsSubmit}
              onUsePresetPersonas={handleUsePresetPersonas}
              isLoading={isLoading}
              loadingProgress={loadingProgress}
              loadingMessage={loadingMessage}
            />
          )}
        </div>

        {/* Review - keep mounted once visited to preserve any edits */}
        <div style={{ display: currentStep === 'review' ? 'block' : 'none' }}>
          {visitedSteps.has('review') && demographics && (
            <ParticipantReview
              profiles={profiles}
              demographics={demographics}
              onProfilesUpdate={handleProfilesUpdate}
              onContinue={handleReviewContinue}
              onSkipToInterviews={handleSkipToInterviews}
            />
          )}
        </div>

        {/* Design Survey - keep mounted once visited to preserve concepts/questions */}
        <div style={{ display: currentStep === 'design' ? 'block' : 'none' }}>
          {visitedSteps.has('design') && (
            <DesignSurvey onSubmit={handleDesignSurveySubmit} isLoading={isLoading} />
          )}
        </div>

        {/* Analysis - transient loading step, always conditional */}
        {currentStep === 'analysis' && (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingBar 
              progress={loadingProgress}
              message={loadingMessage}
              subMessage={`Analyzing ${profiles.length} consumer profiles against ${concepts.length} concepts`}
            />
          </div>
        )}

        {/* Results - keep mounted once visited */}
        <div style={{ display: currentStep === 'results' ? 'block' : 'none' }}>
          {visitedSteps.has('results') && analysisReport && (
            <Analytics report={analysisReport} />
          )}
        </div>

        {/* Insights - chat with personas and download reports */}
        <div style={{ display: currentStep === 'insights' ? 'block' : 'none' }}>
          {visitedSteps.has('insights') && analysisReport && (
            <div className="space-y-8">
              <PersonaChat report={analysisReport} />
              {analysisReport.concepts.length > 0 && (
                <ReportDownload report={analysisReport} />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 PULSE. Powered by myGenAssist. <br /> AI-generated content may contain inaccuracies. Please verify all information before use.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
