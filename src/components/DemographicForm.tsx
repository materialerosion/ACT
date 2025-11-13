'use client';

import React, { useState } from 'react';
import { DemographicInput } from '@/types';
import { Users, MapPin, DollarSign, GraduationCap, Calendar, Target } from 'lucide-react';
import LoadingBar from './LoadingBar';

interface DemographicFormProps {
  onSubmit: (demographics: DemographicInput) => void;
  isLoading?: boolean;
  loadingProgress?: number;
  loadingMessage?: string;
}

export default function DemographicForm({ onSubmit, isLoading, loadingProgress = 0, loadingMessage }: DemographicFormProps) {
  const ageRanges = [
    '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
  ];

  const genderOptions = [
    'Male', 'Female', 'Non-binary', 'Prefer not to say'
  ];

  const locationOptions = [
    'Urban', 'Suburban', 'Rural', 'Metropolitan', 'Small Town'
  ];

  const incomeOptions = [
    'Under $25,000', '$25,000-$50,000', '$50,000-$75,000', 
    '$75,000-$100,000', '$100,000-$150,000', 'Over $150,000'
  ];

  const educationOptions = [
    'High School', 'Some College', 'Bachelor\'s Degree', 
    'Master\'s Degree', 'PhD/Professional Degree'
  ];

  const [demographics, setDemographics] = useState<DemographicInput>({
    ageRanges: [...ageRanges], // All age ranges selected by default
    genders: [...genderOptions], // All genders selected by default
    locations: [...locationOptions], // All locations selected by default
    incomeRanges: [...incomeOptions], // All income ranges selected by default
    educationLevels: [...educationOptions], // All education levels selected by default
    consumerCount: 100,
  });

  const handleCheckboxChange = (field: keyof Omit<DemographicInput, 'consumerCount'>, value: string) => {
    setDemographics(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter(item => item !== value)
        : [...(prev[field] as string[]), value]
    }));
  };

  const handleCountChange = (count: number) => {
    setDemographics(prev => ({
      ...prev,
      consumerCount: count
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(demographics);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Define Target Demographics</h2>
        <p className="text-gray-600">
          Select the demographic parameters to recruit diverse consumer profiles for analysis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Age Ranges */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Age Ranges</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ageRanges.map(range => (
              <label key={range} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={demographics.ageRanges.includes(range)}
                  onChange={() => handleCheckboxChange('ageRanges', range)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{range}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Consumer Count */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <Target className="w-5 h-5 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Number of Consumers to Recruit</h3>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="20"
              max="200"
              step="20"
              value={demographics.consumerCount}
              onChange={(e) => handleCountChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="20"
                max="200"
                step="20"
                value={demographics.consumerCount}
                onChange={(e) => handleCountChange(parseInt(e.target.value))}
                className="w-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-gray-900"
              />
              <span className="text-sm text-gray-600">consumers</span>
            </div>
          </div>
        </div>

        {/* Gender */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <Users className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Gender</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {genderOptions.map(gender => (
              <label key={gender} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={demographics.genders.includes(gender)}
                  onChange={() => handleCheckboxChange('genders', gender)}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">{gender}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <MapPin className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Location Type</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {locationOptions.map(location => (
              <label key={location} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={demographics.locations.includes(location)}
                  onChange={() => handleCheckboxChange('locations', location)}
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{location}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Income */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <DollarSign className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Income Range</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {incomeOptions.map(income => (
              <label key={income} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={demographics.incomeRanges.includes(income)}
                  onChange={() => handleCheckboxChange('incomeRanges', income)}
                  className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
                />
                <span className="text-sm text-gray-700">{income}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <GraduationCap className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Education Level</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {educationOptions.map(education => (
              <label key={education} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={demographics.educationLevels.includes(education)}
                  onChange={() => handleCheckboxChange('educationLevels', education)}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">{education}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Loading Bar */}
        {isLoading && (
          <div className="pt-6">
            <LoadingBar 
              progress={loadingProgress} 
              message={loadingMessage || "Recruiting Consumers"}
              subMessage={`Generating ${demographics.consumerCount} diverse consumer profiles...`}
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Recruiting Consumers...
              </>
            ) : (
              'Recruit Consumer Profiles'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}