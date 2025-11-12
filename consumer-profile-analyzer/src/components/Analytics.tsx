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
import { PreferenceAnalysis, Concept, AnalysisReport, ConsumerProfile } from '@/types';
import { TrendingUp, Star, Zap, BarChart3, Filter, X } from 'lucide-react';

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
  const { concepts, analyses, summary, profiles } = report;

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

  // Prepare data for concepts comparison chart (using filtered data)
  const conceptsData = {
    labels: concepts.map(concept => concept.title),
    datasets: [
      {
        label: 'Preference',
        data: concepts.map(concept => {
          const conceptAnalyses = filteredAnalyses.filter(a => a.conceptId === concept.id);
          return conceptAnalyses.length > 0 ? conceptAnalyses.reduce((sum, a) => sum + a.preference, 0) / conceptAnalyses.length : 0;
        }),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Innovativeness',
        data: concepts.map(concept => {
          const conceptAnalyses = filteredAnalyses.filter(a => a.conceptId === concept.id);
          return conceptAnalyses.length > 0 ? conceptAnalyses.reduce((sum, a) => sum + a.innovativeness, 0) / conceptAnalyses.length : 0;
        }),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
      {
        label: 'Differentiation',
        data: concepts.map(concept => {
          const conceptAnalyses = filteredAnalyses.filter(a => a.conceptId === concept.id);
          return conceptAnalyses.length > 0 ? conceptAnalyses.reduce((sum, a) => sum + a.differentiation, 0) / conceptAnalyses.length : 0;
        }),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
      },
    ],
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
          const avgPref = conceptAnalyses.reduce((sum, a) => sum + a.preference, 0) / conceptAnalyses.length;
          const avgInno = conceptAnalyses.reduce((sum, a) => sum + a.innovativeness, 0) / conceptAnalyses.length;
          const avgDiff = conceptAnalyses.reduce((sum, a) => sum + a.differentiation, 0) / conceptAnalyses.length;
          return (avgPref + avgInno + avgDiff) / 3;
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
        text: 'Consumer Response Analysis by Concepts',
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

  // Calculate filtered summary statistics
  const filteredSummary = useMemo(() => {
    if (filteredAnalyses.length === 0) {
      return {
        averagePreference: 0,
        averageInnovativeness: 0,
        averageDifferentiation: 0,
        topPerformingConcept: 'No data',
      };
    }

    const avgPref = filteredAnalyses.reduce((sum, a) => sum + a.preference, 0) / filteredAnalyses.length;
    const avgInno = filteredAnalyses.reduce((sum, a) => sum + a.innovativeness, 0) / filteredAnalyses.length;
    const avgDiff = filteredAnalyses.reduce((sum, a) => sum + a.differentiation, 0) / filteredAnalyses.length;

    // Find top performing concept in filtered data
    const conceptScores = concepts.map(concept => {
      const conceptAnalyses = filteredAnalyses.filter(a => a.conceptId === concept.id);
      if (conceptAnalyses.length === 0) return { concept, avgScore: 0 };
      const avgScore = conceptAnalyses.reduce((sum, a) => 
        sum + (a.preference + a.innovativeness + a.differentiation) / 3, 0
      ) / conceptAnalyses.length;
      return { concept, avgScore };
    });
    const topConcept = conceptScores.reduce((max, current) => 
      current.avgScore > max.avgScore ? current : max
    );

    return {
      averagePreference: avgPref,
      averageInnovativeness: avgInno,
      averageDifferentiation: avgDiff,
      topPerformingConcept: topConcept.concept.title,
    };
  }, [filteredAnalyses, concepts]);

  // Calculate top and bottom performing concepts (using filtered data)
  const conceptPerformance = concepts.map(concept => {
    const conceptAnalyses = filteredAnalyses.filter(a => a.conceptId === concept.id);
    if (conceptAnalyses.length === 0) return { concept, avgScore: 0 };
    const avgScore = conceptAnalyses.reduce((sum, a) => 
      sum + (a.preference + a.innovativeness + a.differentiation) / 3, 0
    ) / conceptAnalyses.length;
    return { concept, avgScore };
  }).sort((a, b) => b.avgScore - a.avgScore);

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Avg Preference</p>
              <p className="text-3xl font-bold text-blue-800">
                {filteredSummary.averagePreference.toFixed(1)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Avg Innovation</p>
              <p className="text-3xl font-bold text-green-800">
                {filteredSummary.averageInnovativeness.toFixed(1)}
              </p>
            </div>
            <Zap className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Avg Differentiation</p>
              <p className="text-3xl font-bold text-yellow-800">
                {filteredSummary.averageDifferentiation.toFixed(1)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Top Concept</p>
              <p className="text-sm font-bold text-purple-800 leading-tight">
                {filteredSummary.topPerformingConcept}
              </p>
            </div>
            <Star className="w-8 h-8 text-purple-600" />
          </div>
        </div>
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
            <Bar data={conceptsData} options={chartOptions} />
          </div>

          {/* Radar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>
      )}

      {/* Performance Rankings */}
      {filteredProfiles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Claims */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Top Performing Concepts</h3>
            <div className="space-y-3">
              {conceptPerformance.slice(0, 3).map((item, index) => (
                <div key={item.concept.id} className="flex items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-800">{item.concept.title}</p>
                    <p className="text-sm text-gray-600">Score: {item.avgScore.toFixed(2)}/10</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Performing Concepts */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Improvement Opportunities</h3>
            <div className="space-y-3">
              {conceptPerformance.slice(-3).reverse().map((item, index) => (
                <div key={item.concept.id} className="flex items-center p-3 bg-red-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {conceptPerformance.length - index}
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-800">{item.concept.title}</p>
                    <p className="text-sm text-gray-600">Score: {item.avgScore.toFixed(2)}/10</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Key Insights */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
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