'use client';

import React, { useState, useMemo } from 'react';
import { ConsumerProfile } from '@/types';
import { Filter, X } from 'lucide-react';

export interface DemographicFilters {
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

export const emptyFilters: DemographicFilters = {
  ageRanges: [],
  genders: [],
  locations: [],
  incomeRanges: [],
  educationLevels: [],
  techSavviness: [],
  environmentalAwareness: [],
  brandLoyalty: [],
  priceSensitivity: [],
};

interface DemographicFilterPanelProps {
  profiles: ConsumerProfile[];
  filteredCount: number;
  filters: DemographicFilters;
  onFilterChange: (filters: DemographicFilters) => void;
  onClearFilters: () => void;
}

export default function DemographicFilterPanel({
  profiles,
  filteredCount,
  filters,
  onFilterChange,
  onClearFilters,
}: DemographicFilterPanelProps) {
  const [showFilters, setShowFilters] = useState(false);

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

  const toggleFilter = (category: keyof DemographicFilters, value: string) => {
    onFilterChange({
      ...filters,
      [category]: filters[category].includes(value)
        ? filters[category].filter(v => v !== value)
        : [...filters[category], value],
    });
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

  const filterGroups: { key: keyof DemographicFilters; label: string; options: string[]; scrollable?: boolean }[] = [
    { key: 'ageRanges', label: 'Age Range', options: demographicOptions.ageRanges },
    { key: 'genders', label: 'Gender', options: demographicOptions.genders },
    { key: 'locations', label: 'Location', options: demographicOptions.locations, scrollable: true },
    { key: 'incomeRanges', label: 'Income', options: demographicOptions.incomeRanges },
    { key: 'educationLevels', label: 'Education', options: demographicOptions.educationLevels },
    { key: 'techSavviness', label: 'Tech Savviness', options: demographicOptions.techSavviness },
    { key: 'environmentalAwareness', label: 'Environmental Awareness', options: demographicOptions.environmentalAwareness },
    { key: 'brandLoyalty', label: 'Brand Loyalty', options: demographicOptions.brandLoyalty },
    { key: 'priceSensitivity', label: 'Price Sensitivity', options: demographicOptions.priceSensitivity },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Demographics Filter
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            Showing {filteredCount} of {profiles.length} profiles
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
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
          {filterGroups.map(({ key, label, options, scrollable }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
              <div className={`space-y-1 ${scrollable ? 'max-h-32 overflow-y-auto' : ''}`}>
                {options.map(option => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters[key].includes(option)}
                      onChange={() => toggleFilter(key, option)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
