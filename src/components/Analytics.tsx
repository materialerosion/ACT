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
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import { PreferenceAnalysis, Concept, AnalysisReport, ConsumerProfile, Question } from '@/types';
import { TrendingUp, Star, Zap, BarChart3, Filter, X, HelpCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

interface AnalyticsProps {
  report: AnalysisReport;
}

interface DemographicFilters {
  ageRanges: string[];
  genders: string[];
  locations: string[];
  incomeRanges: string[];
  educationLevels: string[];
  techSavviness: string[];
  environmentalAwareness: string[];
  brandLoyalty: string[];
  priceSensitivity: string[];
}

export default function Analytics({ report }: AnalyticsProps) {
  const { concepts, analyses, summary, profiles, questions: reportQuestions } = report;
  const questions = reportQuestions || [];

  // Demographics filter state
  const [filters, setFilters] = useState<DemographicFilters>({
    ageRanges: [],
    genders: [],
    locations: [],
    incomeRanges: [],
    educationLevels: [],
    techSavviness: [],
    environmentalAwareness: [],
    brandLoyalty: [],
    priceSensitivity: [],
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(questions.length > 0 ? questions[0].id : null);

  // Get unique values for each demographic category
  const demographicOptions = useMemo(() => {
    return {
      ageRanges: [...new Set(profiles.map(p => {
        if (p.age < 25) return '18-24';
        if (p.age < 35) return '25-34';
        if (p.age < 45) return '35-44';
        if (p.age < 55) return '45-54';
        if (p.age < 65) return '55-64';
        return '65+';
      }))].sort(),
      genders: [...new Set(profiles.map(p => p.gender))].sort(),
      locations: [...new Set(profiles.map(p => p.location))].sort(),
      incomeRanges: [...new Set(profiles.map(p => p.income))].sort(),
      educationLevels: [...new Set(profiles.map(p => p.education))].sort(),
      techSavviness: [...new Set(profiles.map(p => p.techSavviness))].sort(),
      environmentalAwareness: [...new Set(profiles.map(p => p.environmentalAwareness))].sort(),
      brandLoyalty: [...new Set(profiles.map(p => p.brandLoyalty))].sort(),
      priceSensitivity: [...new Set(profiles.map(p => p.pricesensitivity))].sort(),
    };
  }, [profiles]);

  // Filter profiles based on selected filters
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      // Age filter
      if (filters.ageRanges.length > 0) {
        const ageRange = profile.age < 25 ? '18-24' :
                        profile.age < 35 ? '25-34' :
                        profile.age < 45 ? '35-44' :
                        profile.age < 55 ? '45-54' :
                        profile.age < 65 ? '55-64' : '65+';
        if (!filters.ageRanges.includes(ageRange)) return false;
      }

      // Other demographic filters
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

  // Helper function to toggle filter selection
  const toggleFilter = (category: keyof DemographicFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      ageRanges: [],
      genders: [],
      locations: [],
      incomeRanges: [],
      educationLevels: [],
      techSavviness: [],
      environmentalAwareness: [],
      brandLoyalty: [],
      priceSensitivity: [],
    });
  };



  // Prepare data for radar chart (overall performance, using filtered data)
  const radarData = {
    labels: concepts.map(concept => 
      concept.title.length > 20 ? concept.title.substring(0, 20) + '...' : concept.title
    ),
    datasets: [
      {
        label: 'Overall Score',
        data: concepts.map(concept => {
          const conceptAnalyses = filteredAnalyses.filter(a => a.conceptId === concept.id);
          if (conceptAnalyses.length === 0) return 0;

          const getAvgForQuestion = (qId: string) => {
            const responses = conceptAnalyses
              .map(a => a.questionResponses ? Number(a.questionResponses[qId]) : NaN)
              .filter(n => !isNaN(n));
            return responses.length > 0 ? responses.reduce((sum, r) => sum + r, 0) / responses.length : 0;
          };

          const avgPref = getAvgForQuestion('preference');
          const avgInno = getAvgForQuestion('innovativeness');
          const avgDiff = getAvgForQuestion('differentiation');
          
          const scoreComponents = [avgPref, avgInno, avgDiff].filter(s => s > 0);
          if (scoreComponents.length === 0) return 0;

          return scoreComponents.reduce((sum, s) => sum + s, 0) / scoreComponents.length;
        }),
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(139, 92, 246, 1)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Survey Questions Analysis',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
      },
    },
  };

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Overall Performance Radar',
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 10,
      },
    },
  };
  const summaryCardData = useMemo(() => {
    if (filteredAnalyses.length === 0) {
        return [];
    }

    const scaleQuestions = questions.filter(
        q => (q.type === 'scale_1_5' || q.type === 'scale_1_10') && q.enabled
    );

    const cards = scaleQuestions.map(question => {
        const getResponseValue = (analysis: PreferenceAnalysis): number | null => {
            if (analysis.questionResponses && analysis.questionResponses[question.id] !== undefined) {
                const value = Number(analysis.questionResponses[question.id]);
                return isNaN(value) ? null : value;
            }
            return null;
        }

        const responses = filteredAnalyses.map(getResponseValue).filter((r): r is number => r !== null);
        const average = responses.length > 0 ? responses.reduce((sum, r) => sum + r, 0) / responses.length : 0;

        return {
            id: question.id,
            text: question.text,
            value: average.toFixed(1),
            maxValue: question.type === 'scale_1_5' ? 5 : 10,
            isNumeric: true,
        };
    });

    // Add Top Performing Concept
    const conceptScores = concepts.map(concept => {
      const conceptAnalyses = filteredAnalyses.filter(a => a.conceptId === concept.id);
      if (conceptAnalyses.length === 0) return { concept, avgScore: 0 };
      
      const getAvgForQuestion = (qId: string) => {
        const responses = conceptAnalyses
          .map(a => a.questionResponses ? Number(a.questionResponses[qId]) : NaN)
          .filter(n => !isNaN(n));
        return responses.length > 0 ? responses.reduce((sum, r) => sum + r, 0) / responses.length : 0;
      };

      const scoreComponents = ['preference', 'innovativeness', 'differentiation']
        .map(qId => getAvgForQuestion(qId))
        .filter(score => score > 0);

      if (scoreComponents.length === 0) return { concept, avgScore: 0 };
        
      const avgScore = scoreComponents.reduce((sum, s) => sum + s, 0) / scoreComponents.length;
      return { concept, avgScore };
    });

    if (conceptScores.length > 0) {
        const topConcept = conceptScores.reduce((max, current) => 
            current.avgScore > max.avgScore ? current : max
        );
        if (topConcept.avgScore > 0) {
            cards.push({
                id: 'top-concept',
                text: 'Top Concept',
                value: topConcept.concept.title,
                isNumeric: false,
            } as any);
        }
    }

    return cards;
  }, [filteredAnalyses, questions, concepts]);


  const selectedQuestion = useMemo(() => questions.find(q => q.id === selectedQuestionId), [questions, selectedQuestionId]);

  const questionChartData = useMemo(() => {
    if (!selectedQuestion || (selectedQuestion.type !== 'scale_1_5' && selectedQuestion.type !== 'scale_1_10')) return null;

    return {
      labels: concepts.map(c => c.title),
      datasets: [
        {
          label: selectedQuestion.text,
          data: concepts.map(concept => {
            const conceptAnalyses = filteredAnalyses.filter(a => a.conceptId === concept.id && a.questionResponses && a.questionResponses[selectedQuestion.id]);
            return conceptAnalyses.length > 0
              ? conceptAnalyses.reduce((sum, a) => sum + Number(a.questionResponses![selectedQuestion.id]), 0) / conceptAnalyses.length
              : 0;
          }),
          backgroundColor: 'rgba(79, 70, 229, 0.8)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [filteredAnalyses, concepts, selectedQuestion]);


  const questionOpenEndedData = useMemo(() => {
    if (!selectedQuestion || selectedQuestion.type !== 'open_ended') return null;
    return filteredAnalyses.map(analysis => ({
      response: analysis.questionResponses ? analysis.questionResponses[selectedQuestion.id] : 'N/A',
      profile: profiles.find(p => p.id === analysis.profileId)
    })).filter(item => item.response && item.response !== 'N/A');

  }, [filteredAnalyses, selectedQuestion, profiles]);


  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Demographics Filter Panel */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Demographics Filter
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Showing {filteredProfiles.length} of {profiles.length} profiles
            </span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            {(Object.values(filters).some(arr => arr.length > 0)) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center"
              >
                <X className="w-3 h-3 mr-1" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Age Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age Range</label>
              <div className="space-y-1">
                {demographicOptions.ageRanges.map(age => (
                  <label key={age} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.ageRanges.includes(age)}
                      onChange={() => toggleFilter('ageRanges', age)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{age}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <div className="space-y-1">
                {demographicOptions.genders.map(gender => (
                  <label key={gender} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.genders.includes(gender)}
                      onChange={() => toggleFilter('genders', gender)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{gender}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {demographicOptions.locations.map(location => (
                  <label key={location} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.locations.includes(location)}
                      onChange={() => toggleFilter('locations', location)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{location}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Income Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Income</label>
              <div className="space-y-1">
                {demographicOptions.incomeRanges.map(income => (
                  <label key={income} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.incomeRanges.includes(income)}
                      onChange={() => toggleFilter('incomeRanges', income)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{income}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Education Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
              <div className="space-y-1">
                {demographicOptions.educationLevels.map(education => (
                  <label key={education} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.educationLevels.includes(education)}
                      onChange={() => toggleFilter('educationLevels', education)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{education}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tech Savviness Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tech Savviness</label>
              <div className="space-y-1">
                {demographicOptions.techSavviness.map(tech => (
                  <label key={tech} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.techSavviness.includes(tech)}
                      onChange={() => toggleFilter('techSavviness', tech)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{tech}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Environmental Awareness Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Environmental Awareness</label>
              <div className="space-y-1">
                {demographicOptions.environmentalAwareness.map(env => (
                  <label key={env} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.environmentalAwareness.includes(env)}
                      onChange={() => toggleFilter('environmentalAwareness', env)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{env}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brand Loyalty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand Loyalty</label>
              <div className="space-y-1">
                {demographicOptions.brandLoyalty.map(brand => (
                  <label key={brand} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.brandLoyalty.includes(brand)}
                      onChange={() => toggleFilter('brandLoyalty', brand)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Sensitivity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Sensitivity</label>
              <div className="space-y-1">
                {demographicOptions.priceSensitivity.map(price => (
                  <label key={price} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.priceSensitivity.includes(price)}
                      onChange={() => toggleFilter('priceSensitivity', price)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{price}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCardData.map((card, index) => {
            const visualIndex = index % 4;
            let Icon, classes;

            switch (visualIndex) {
                case 0:
                    Icon = TrendingUp;
                    classes = {
                        bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', textBold: 'text-blue-800'
                    };
                    break;
                case 1:
                    Icon = Zap;
                    classes = {
                        bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', textBold: 'text-green-800'
                    };
                    break;
                case 2:
                    Icon = BarChart3;
                    classes = {
                        bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', textBold: 'text-yellow-800'
                    };
                    break;
                default:
                    Icon = Star;
                    classes = {
                        bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', textBold: 'text-purple-800'
                    };
                    break;
            }

            return (
                <div key={card.id} className={`${classes.bg} p-6 rounded-lg border ${classes.border}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`${classes.text} text-sm font-medium`}>{card.text}</p>
                            {card.isNumeric ? (
                                <p className={`text-3xl font-bold ${classes.textBold}`}>
                                    {card.value}
                                    <span className="text-xl">/{card.maxValue}</span>
                                </p>
                            ) : (
                                <p className={`text-lg font-bold ${classes.textBold} leading-tight`}>
                                    {card.value}
                                </p>
                            )}
                        </div>
                        <Icon className={`w-8 h-8 ${classes.text}`} />
                    </div>
                </div>
            );
        })}
      </div>

      {/* Charts Row */}
      {filteredProfiles.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-gray-500 text-lg mb-2">No profiles match the selected filters</p>
          <p className="text-gray-400">Try adjusting your filter criteria or clearing all filters to see data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>
      )}
      
      {/* Questions Analysis */}
      {questions && questions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <HelpCircle className="w-5 h-5 mr-2" />
              Question Analysis
            </h3>
            <select
              value={selectedQuestionId || ''}
              onChange={e => setSelectedQuestionId(e.target.value)}
              className="px-3 py-1 text-sm bg-gray-100 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {questions.map((q: Question) => (
                <option key={q.id} value={q.id}>{q.text}</option>
              ))}
            </select>
          </div>

          {filteredProfiles.length === 0 ? (
              <div className="text-center py-8">
                  <p className="text-gray-500 text-lg mb-2">No profiles match the selected filters</p>
                  <p className="text-gray-400">Try adjusting your filter criteria to see question data.</p>
              </div>
          ) : (
            <div>
              {selectedQuestion && (selectedQuestion.type === 'scale_1_5' || selectedQuestion.type === 'scale_1_10') && questionChartData && (
                <Bar data={questionChartData} options={{
                  ...chartOptions,
                  scales: { y: { beginAtZero: true, max: selectedQuestion.type === 'scale_1_5' ? 5 : 10 } },
                  plugins: { ...chartOptions.plugins, title: { display: true, text: selectedQuestion.text } }
                }} />
              )}


              {selectedQuestion && selectedQuestion.type === 'open_ended' && questionOpenEndedData && (
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3">{selectedQuestion.text} - Responses</h4>
                  <div className="max-h-96 overflow-y-auto space-y-3 pr-4">
                    {questionOpenEndedData.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-800">{String(item.response)}</p>
                        {item.profile && <p className="text-xs text-gray-500 mt-1">- {item.profile.name}, {item.profile.age}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      

      {/* Key Insights */}
      <div className="bg-w-ite p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.insights.map((insight, index) => (
            <div key={index} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
              <p className="text-gray-700">{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
