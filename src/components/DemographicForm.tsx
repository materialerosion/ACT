'use client';

import React, { useState } from 'react';
import { DemographicInput, ConsumerProfile } from '@/types';
import { Users, MapPin, DollarSign, GraduationCap, Calendar, Target, Upload, FileText, ChevronDown, ChevronUp, UserCheck, ArrowRight } from 'lucide-react';
import LoadingBar from './LoadingBar';
import DualRangeSlider from './DualRangeSlider';
import { PRESET_PERSONA_SETS, PresetPersonaSet } from '@/data/presetPersonas';

interface DemographicFormProps {
  onSubmit: (demographics: DemographicInput) => void;
  onUsePresetPersonas?: (profiles: ConsumerProfile[]) => void;
  isLoading?: boolean;
  loadingProgress?: number;
  loadingMessage?: string;
}

export default function DemographicForm({ onSubmit, onUsePresetPersonas, isLoading, loadingProgress = 0, loadingMessage }: DemographicFormProps) {
  const genderOptions = [
    'Male', 'Female', 'Non-binary', 'Prefer not to say'
  ];

  const locationOptions = [
    'Urban', 'Suburban', 'Rural', 'Metropolitan', 'Small Town'
  ];

  const educationOptions = [
    'High School', 'Some College', 'Bachelor\'s Degree', 
    'Master\'s Degree', 'PhD/Professional Degree'
  ];

  const [demographics, setDemographics] = useState<DemographicInput>({
    ageRanges: [],
    genders: [...genderOptions],
    locations: [...locationOptions],
    incomeRanges: [],
    educationLevels: [...educationOptions],
    consumerCount: 100,
    ageMin: 17,
    ageMax: 65,
    incomeMin: 24000,
    incomeMax: 151000,
    additionalContext: '',
    uploadedFiles: []
  });

  const [showAdditionalContext, setShowAdditionalContext] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [showPresetDetails, setShowPresetDetails] = useState<string | null>(null);
  const [ageMinInput, setAgeMinInput] = useState('17');
  const [ageMaxInput, setAgeMaxInput] = useState('65');
  const [incomeMinInput, setIncomeMinInput] = useState('24000');
  const [incomeMaxInput, setIncomeMaxInput] = useState('151000');

  const handleCheckboxChange = (field: keyof Omit<DemographicInput, 'consumerCount' | 'ageMin' | 'ageMax' | 'incomeMin' | 'incomeMax' | 'additionalContext' | 'uploadedFiles'>, value: string) => {
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

  const handleAgeMinChange = (value: number) => {
    const clampedValue = Math.max(17, Math.min(value, demographics.ageMax! - 1));
    setAgeMinInput(clampedValue.toString());
    setDemographics(prev => ({
      ...prev,
      ageMin: clampedValue
    }));
  };

  const handleAgeMaxChange = (value: number) => {
    const clampedValue = Math.min(65, Math.max(value, demographics.ageMin! + 1));
    setAgeMaxInput(clampedValue.toString());
    setDemographics(prev => ({
      ...prev,
      ageMax: clampedValue
    }));
  };

  const handleIncomeMinChange = (value: number) => {
    const clampedValue = Math.max(24000, Math.min(value, demographics.incomeMax! - 1000));
    setIncomeMinInput(clampedValue.toString());
    setDemographics(prev => ({
      ...prev,
      incomeMin: clampedValue
    }));
  };

  const handleIncomeMaxChange = (value: number) => {
    const clampedValue = Math.min(151000, Math.max(value, demographics.incomeMin! + 1000));
    setIncomeMaxInput(clampedValue.toString());
    setDemographics(prev => ({
      ...prev,
      incomeMax: clampedValue
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const uploadedFiles = await Promise.all(
      Array.from(files).map(async (file) => {
        const content = await file.text();
        return {
          name: file.name,
          content: content,
          type: file.type
        };
      })
    );

    setDemographics(prev => ({
      ...prev,
      uploadedFiles: [...(prev.uploadedFiles || []), ...uploadedFiles]
    }));
  };

  const removeFile = (index: number) => {
    setDemographics(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles?.filter((_, i) => i !== index)
    }));
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value}`;
  };

  const togglePresetSelection = (presetId: string) => {
    setSelectedPresets(prev => {
      const next = new Set(prev);
      if (next.has(presetId)) {
        next.delete(presetId);
      } else {
        next.add(presetId);
      }
      return next;
    });
  };

  const getSelectedPresetProfiles = (): ConsumerProfile[] => {
    return PRESET_PERSONA_SETS
      .filter(set => selectedPresets.has(set.id))
      .flatMap(set => set.profiles);
  };

  const handleUsePresets = () => {
    if (onUsePresetPersonas && selectedPresets.size > 0) {
      onUsePresetPersonas(getSelectedPresetProfiles());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = { ...demographics };

    // Ensure genders is not empty
    if (submissionData.genders.length === 0) {
      submissionData.genders = [...genderOptions];
    }

    // Ensure ageRanges is populated
    if (submissionData.ageMin && submissionData.ageMax) {
      submissionData.ageRanges = [`${submissionData.ageMin}-${submissionData.ageMax}`];
    }
    
    onSubmit(submissionData);
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
        {/* Age Range Slider */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Age Range</h3>
          </div>
          <DualRangeSlider
            min={17}
            max={65}
            step={1}
            minValue={demographics.ageMin!}
            maxValue={demographics.ageMax!}
            onChange={(min, max) => {
              setAgeMinInput(min.toString());
              setAgeMaxInput(max.toString());
              setDemographics(prev => ({
                ...prev,
                ageMin: min,
                ageMax: max
              }));
            }}
            formatLabel={(value) => `${value} years`}
            color="#3B82F6"
            minBoundLabel="(includes <18)"
            maxBoundLabel="(includes 65+)"
          />
          <div className="flex items-center justify-between space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Min Age:</label>
              <input
                type="number"
                min="17"
                max="65"
                value={ageMinInput}
                onChange={(e) => {
                  setAgeMinInput(e.target.value);
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    handleAgeMinChange(value);
                  }
                }}
                onBlur={() => setAgeMinInput(demographics.ageMin!.toString())}
                className="w-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-gray-900"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Max Age:</label>
              <input
                type="number"
                min="17"
                max="65"
                value={ageMaxInput}
                onChange={(e) => {
                  setAgeMaxInput(e.target.value);
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    handleAgeMaxChange(value);
                  }
                }}
                onBlur={() => setAgeMaxInput(demographics.ageMax!.toString())}
                className="w-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Income Range Slider */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <DollarSign className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Income Range</h3>
          </div>
          <DualRangeSlider
            min={24000}
            max={151000}
            step={1000}
            minValue={demographics.incomeMin!}
            maxValue={demographics.incomeMax!}
            onChange={(min, max) => {
              setIncomeMinInput(min.toString());
              setIncomeMaxInput(max.toString());
              setDemographics(prev => ({
                ...prev,
                incomeMin: min,
                incomeMax: max
              }));
            }}
            formatLabel={(value) => formatCurrency(value)}
            color="#CA8A04"
            minBoundLabel="(includes <$25k)"
            maxBoundLabel="(includes >$150k)"
          />
          <div className="flex items-center justify-between space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Min Income:</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="24000"
                  max="151000"
                  step="1000"
                  value={incomeMinInput}
                  onChange={(e) => {
                    setIncomeMinInput(e.target.value);
                    const value = parseInt(e.target.value);
                    if (!isNaN(value)) {
                      handleIncomeMinChange(value);
                    }
                  }}
                  onBlur={() => setIncomeMinInput(demographics.incomeMin!.toString())}
                  className="w-32 pl-6 pr-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Max Income:</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="24000"
                  max="151000"
                  step="1000"
                  value={incomeMaxInput}
                  onChange={(e) => {
                    setIncomeMaxInput(e.target.value);
                    const value = parseInt(e.target.value);
                    if (!isNaN(value)) {
                      handleIncomeMaxChange(value);
                    }
                  }}
                  onBlur={() => setIncomeMaxInput(demographics.incomeMax!.toString())}
                  className="w-32 pl-6 pr-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
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
              min="1"
              max="200"
              step="1"
              value={demographics.consumerCount}
              onChange={(e) => handleCountChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="200"
                step="1"
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

        {/* Additional Context Section */}
        <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
          <button
            type="button"
            onClick={() => setShowAdditionalContext(!showAdditionalContext)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Additional Context (Optional)</h3>
            </div>
            {showAdditionalContext ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
          </button>
          
          {showAdditionalContext && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Research Documents
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Upload user research, surveys, interviews, or other relevant documents to provide additional context for profile generation.
                </p>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-4 h-4 mr-2 text-indigo-600" />
                    <span className="text-sm text-gray-700">Choose Files</span>
                    <input
                      type="file"
                      multiple
                      accept=".txt,.pdf,.doc,.docx,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {demographics.uploadedFiles && demographics.uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {demographics.uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Context / User Research Notes
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Provide any additional context, user research findings, behavioral insights, or specific requirements to guide the AI in generating more accurate personas.
                </p>
                <textarea
                  value={demographics.additionalContext}
                  onChange={(e) => setDemographics(prev => ({ ...prev, additionalContext: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  rows={6}
                  placeholder="Example: Our research shows that users in this demographic prefer sustainable products and are willing to pay premium prices. They are active on social media and influenced by peer reviews..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Pre-Generated Persona Sets */}
        {onUsePresetPersonas && (
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <div className="flex items-center mb-3">
              <UserCheck className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Or Use Pre-Generated Personas</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Skip AI generation and proceed with curated OAD brand consumer personas. Select one or more sets below.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {PRESET_PERSONA_SETS.map((preset) => (
                <div
                  key={preset.id}
                  className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    selectedPresets.has(preset.id)
                      ? 'border-green-500 bg-green-100 shadow-md'
                      : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'
                  }`}
                  onClick={() => togglePresetSelection(preset.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{preset.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-800">{preset.name}</h4>
                        <p className="text-xs text-gray-500">{preset.profiles.length} personas</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedPresets.has(preset.id)
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedPresets.has(preset.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{preset.description}</p>

                  {/* Expand/collapse persona names */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPresetDetails(showPresetDetails === preset.id ? null : preset.id);
                    }}
                    className="mt-2 text-xs text-green-700 hover:text-green-900 underline"
                  >
                    {showPresetDetails === preset.id ? 'Hide details' : 'Show personas'}
                  </button>

                  {showPresetDetails === preset.id && (
                    <div className="mt-2 space-y-1">
                      {preset.profiles.map((p) => (
                        <div key={p.id} className="text-xs text-gray-600 flex items-center">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 flex-shrink-0" />
                          <span className="font-medium">{p.name}</span>
                          <span className="text-gray-400 ml-1">— {p.age}y, {p.gender}, {p.location}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedPresets.size > 0 && (
              <div className="flex items-center justify-between bg-green-100 rounded-lg p-3 border border-green-300">
                <span className="text-sm text-green-800">
                  <strong>{getSelectedPresetProfiles().length}</strong> persona{getSelectedPresetProfiles().length !== 1 ? 's' : ''} selected from{' '}
                  <strong>{selectedPresets.size}</strong> set{selectedPresets.size !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={handleUsePresets}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                >
                  Use Selected Personas
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            )}
          </div>
        )}

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
