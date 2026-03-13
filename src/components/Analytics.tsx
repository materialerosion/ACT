'use client';

import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { AnalysisReport } from '@/types';
import {
  DemographicFilterPanel,
  ConceptComparisonTable,
  QuestionSummaryCard,
  InsightsPanel,
  emptyFilters,
} from './results';
import type { DemographicFilters } from './results';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AnalyticsProps {
  report: AnalysisReport;
}

export default function Analytics({ report }: AnalyticsProps) {
  const { concepts, analyses, summary, profiles, questions: reportQuestions } = report;
  const questions = reportQuestions || [];
  const enabledQuestions = questions.filter(q => q.enabled);

  const [filters, setFilters] = useState<DemographicFilters>(emptyFilters);

  // Filter profiles based on selected filters
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      if (filters.ageRanges.length > 0) {
        const ageRange =
          profile.age < 25 ? '18-24' :
          profile.age < 35 ? '25-34' :
          profile.age < 45 ? '35-44' :
          profile.age < 55 ? '45-54' :
          profile.age < 65 ? '55-64' : '65+';
        if (!filters.ageRanges.includes(ageRange)) return false;
      }
      if (filters.genders.length > 0 && !filters.genders.includes(profile.gender)) return false;
      if (filters.locations.length > 0 && !filters.locations.includes(profile.location)) return false;
      if (filters.incomeRanges.length > 0 && !filters.incomeRanges.includes(profile.income)) return false;
      if (filters.educationLevels.length > 0 && !filters.educationLevels.includes(profile.education)) return false;
      if (filters.techSavviness.length > 0 && !filters.techSavviness.includes(profile.techSavviness)) return false;
      if (filters.environmentalAwareness.length > 0 && !filters.environmentalAwareness.includes(profile.environmentalAwareness)) return false;
      if (filters.brandLoyalty.length > 0 && !filters.brandLoyalty.includes(profile.brandLoyalty)) return false;
      if (filters.priceSensitivity.length > 0 && !filters.priceSensitivity.includes(profile.pricesensitivity)) return false;
      return true;
    });
  }, [profiles, filters]);

  // Filter analyses based on filtered profiles
  const filteredAnalyses = useMemo(() => {
    const filteredProfileIds = new Set(filteredProfiles.map(p => p.id));
    return analyses.filter(analysis => filteredProfileIds.has(analysis.profileId));
  }, [analyses, filteredProfiles]);

  const clearFilters = () => setFilters(emptyFilters);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Demographics Filter Panel */}
      <DemographicFilterPanel
        profiles={profiles}
        filteredCount={filteredProfiles.length}
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={clearFilters}
      />

      {filteredProfiles.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-gray-500 text-lg mb-2">No profiles match the selected filters</p>
          <p className="text-gray-400">Try adjusting your filter criteria or clearing all filters to see data.</p>
        </div>
      ) : (
        <>
          {/* Concept Comparison Table */}
          <ConceptComparisonTable
            concepts={concepts}
            analyses={filteredAnalyses}
            questions={enabledQuestions}
          />

          {/* Key Insights */}
          <InsightsPanel insights={summary.insights} />

          {/* Per-Question Summary Cards */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Question-by-Question Analysis</h3>
            {enabledQuestions.map(question => (
              <QuestionSummaryCard
                key={question.id}
                question={question}
                concepts={concepts}
                analyses={filteredAnalyses}
                profiles={filteredProfiles}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
