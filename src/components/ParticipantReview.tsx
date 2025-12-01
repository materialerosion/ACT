'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ConsumerProfile, DemographicInput } from '@/types';
import { 
  Users, 
  Edit3, 
  UserX, 
  UserPlus, 
  BarChart3, 
  ChevronDown, 
  ChevronUp,
  Save,
  X,
  Check
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ParticipantReviewProps {
  profiles: ConsumerProfile[];
  demographics: DemographicInput;
  onProfilesUpdate: (profiles: ConsumerProfile[]) => void;
  onContinue: () => void;
}

export default function ParticipantReview({ 
  profiles, 
  demographics, 
  onProfilesUpdate, 
  onContinue 
}: ParticipantReviewProps) {
  const [filteredProfiles, setFilteredProfiles] = useState<ConsumerProfile[]>(profiles);
  const [excludedProfiles, setExcludedProfiles] = useState<Set<string>>(new Set());
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editedProfile, setEditedProfile] = useState<ConsumerProfile | null>(null);
  const [showDemographics, setShowDemographics] = useState(true);
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showManualRecruit, setShowManualRecruit] = useState(false);
  const [manualProfile, setManualProfile] = useState<Partial<ConsumerProfile>>({
    name: '',
    age: 25,
    gender: 'Female',
    location: 'Urban',
    income: '$50,000 - $75,000',
    education: 'Bachelor\'s degree',
    lifestyle: '',
    interests: [],
    shoppingBehavior: 'Researches extensively before purchasing',
    techSavviness: 'Medium',
    environmentalAwareness: 'Medium',
    brandLoyalty: 'Medium',
    pricesensitivity: 'Medium'
  });

  const manualRecruitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let filtered = profiles.filter(profile => !excludedProfiles.has(profile.id));
    
    if (ageFilter !== 'all') {
      const [minAge, maxAge] = ageFilter.split('-').map(Number);
      filtered = filtered.filter(profile => 
        profile.age >= minAge && profile.age <= (maxAge || minAge + 10)
      );
    }
    
    if (genderFilter !== 'all') {
      filtered = filtered.filter(profile => profile.gender === genderFilter);
    }
    
    if (locationFilter !== 'all') {
      filtered = filtered.filter(profile => profile.location === locationFilter);
    }
    
    setFilteredProfiles(filtered);
  }, [profiles, excludedProfiles, ageFilter, genderFilter, locationFilter]);

  const excludeProfile = (profileId: string) => {
    setExcludedProfiles(prev => new Set([...prev, profileId]));
  };

  const includeProfile = (profileId: string) => {
    setExcludedProfiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(profileId);
      return newSet;
    });
  };

  const startEditing = (profile: ConsumerProfile) => {
    setEditingProfile(profile.id);
    setEditedProfile({ ...profile });
  };

  const saveEdit = () => {
    if (editedProfile) {
      const updatedProfiles = profiles.map(profile =>
        profile.id === editedProfile.id ? editedProfile : profile
      );
      onProfilesUpdate(updatedProfiles);
      setEditingProfile(null);
      setEditedProfile(null);
    }
  };

  const cancelEdit = () => {
    setEditingProfile(null);
    setEditedProfile(null);
  };

  const handleContinue = () => {
    const finalProfiles = profiles.filter(profile => !excludedProfiles.has(profile.id));
    onProfilesUpdate(finalProfiles);
    onContinue();
  };

  const addManualProfile = () => {
    if (manualProfile.name && manualProfile.lifestyle) {
      const newProfile: ConsumerProfile = {
        id: `manual-${Date.now()}`,
        name: manualProfile.name!,
        age: manualProfile.age!,
        gender: manualProfile.gender!,
        location: manualProfile.location!,
        income: manualProfile.income!,
        education: manualProfile.education!,
        lifestyle: manualProfile.lifestyle!,
        interests: manualProfile.interests!,
        shoppingBehavior: manualProfile.shoppingBehavior!,
        techSavviness: manualProfile.techSavviness!,
        environmentalAwareness: manualProfile.environmentalAwareness!,
        brandLoyalty: manualProfile.brandLoyalty!,
        pricesensitivity: manualProfile.pricesensitivity!
      };
      
      const updatedProfiles = [...profiles, newProfile];
      onProfilesUpdate(updatedProfiles);
      
      // Reset form
      setManualProfile({
        name: '',
        age: 25,
        gender: 'Male',
        location: 'Urban',
        income: '$50,000 - $75,000',
        education: 'Bachelor\'s degree',
        lifestyle: '',
        interests: [],
        shoppingBehavior: 'Researches extensively before purchasing',
        techSavviness: 'Medium',
        environmentalAwareness: 'Medium',
        brandLoyalty: 'Medium',
        pricesensitivity: 'Medium'
      });
      setShowManualRecruit(false);
    }
  };

  const cancelManualRecruit = () => {
    setShowManualRecruit(false);
    setManualProfile({
      name: '',
      age: 25,
      gender: 'Male',
      location: 'Urban',
      income: '$50,000 - $75,000',
      education: 'Bachelor\'s degree',
      lifestyle: '',
      interests: [],
      shoppingBehavior: 'Researches extensively before purchasing',
      techSavviness: 'Medium',
      environmentalAwareness: 'Medium',
      brandLoyalty: 'Medium',
      pricesensitivity: 'Medium'
    });
  };

  // Prepare demographic charts data
  const ageData = {
    labels: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
    datasets: [{
      label: 'Number of Participants',
      data: [
        filteredProfiles.filter(p => p.age >= 18 && p.age <= 24).length,
        filteredProfiles.filter(p => p.age >= 25 && p.age <= 34).length,
        filteredProfiles.filter(p => p.age >= 35 && p.age <= 44).length,
        filteredProfiles.filter(p => p.age >= 45 && p.age <= 54).length,
        filteredProfiles.filter(p => p.age >= 55 && p.age <= 64).length,
        filteredProfiles.filter(p => p.age >= 65).length,
      ],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    }]
  };

  const genderCounts = filteredProfiles.reduce((acc, profile) => {
    acc[profile.gender] = (acc[profile.gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const genderData = {
    labels: Object.keys(genderCounts),
    datasets: [{
      data: Object.values(genderCounts),
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(245, 158, 11, 0.8)',
      ],
    }]
  };

  const locationCounts = filteredProfiles.reduce((acc, profile) => {
    acc[profile.location] = (acc[profile.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationData = {
    labels: Object.keys(locationCounts),
    datasets: [{
      data: Object.values(locationCounts),
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(14, 165, 233, 0.8)',
      ],
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Review Participants</h2>
              <p className="text-gray-600">
                {filteredProfiles.length} of {profiles.length} participants selected
                {excludedProfiles.size > 0 && ` (${excludedProfiles.size} excluded)`}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowManualRecruit(true);
                setTimeout(() => {
                  manualRecruitRef.current?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                  });
                }, 100);
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Recruit Manually
            </button>
            <button
              onClick={handleContinue}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue with {filteredProfiles.length} Participants
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Age</label>
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">All Ages</option>
              <option value="18-24">18-24</option>
              <option value="25-34">25-34</option>
              <option value="35-44">35-44</option>
              <option value="45-54">45-54</option>
              <option value="55-64">55-64</option>
              <option value="65-100">65+</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Gender</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">All Genders</option>
              {Array.from(new Set(profiles.map(p => p.gender))).map(gender => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">All Locations</option>
              {Array.from(new Set(profiles.map(p => p.location))).map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Demographics Charts */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <button
          onClick={() => setShowDemographics(!showDemographics)}
          className="flex items-center justify-between w-full mb-4"
        >
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Demographic Overview
          </h3>
          {showDemographics ? <ChevronUp /> : <ChevronDown />}
        </button>
        
        {showDemographics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Age Distribution</h4>
              <Bar data={ageData} options={chartOptions} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Gender Distribution</h4>
              <Pie data={genderData} options={chartOptions} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Location Distribution</h4>
              <Pie data={locationData} options={chartOptions} />
            </div>
          </div>
        )}
      </div>

      {/* Manual Recruit Form */}
      {showManualRecruit && (
        <div ref={manualRecruitRef} className="bg-white p-6 rounded-lg shadow-lg border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-green-600" />
              Recruit Participant Manually
            </h3>
            <button
              onClick={cancelManualRecruit}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={manualProfile.name || ''}
                  onChange={(e) => setManualProfile(prev => ({...prev, name: e.target.value}))}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-green-500"
                  placeholder="Enter participant name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  value={manualProfile.age || ''}
                  onChange={(e) => setManualProfile(prev => ({...prev, age: parseInt(e.target.value)}))}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-green-500"
                  min="18"
                  max="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={manualProfile.gender || ''}
                  onChange={(e) => setManualProfile(prev => ({...prev, gender: e.target.value}))}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-green-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={manualProfile.location || ''}
                  onChange={(e) => setManualProfile(prev => ({...prev, location: e.target.value}))}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-green-500"
                >
                  <option value="Urban">Urban</option>
                  <option value="Suburban">Suburban</option>
                  <option value="Rural">Rural</option>
                  <option value="Metropolitan">Metropolitan</option>
                  <option value="Small Town">Small Town</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Income Range</label>
                <select
                  value={manualProfile.income || ''}
                  onChange={(e) => setManualProfile(prev => ({...prev, income: e.target.value}))}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-green-500"
                >
                  <option value="Under $25,000">Under $25,000</option>
                  <option value="$25,000 - $50,000">$25,000 - $50,000</option>
                  <option value="$50,000 - $75,000">$50,000 - $75,000</option>
                  <option value="$75,000 - $100,000">$75,000 - $100,000</option>
                  <option value="$100,000 - $150,000">$100,000 - $150,000</option>
                  <option value="Over $150,000">Over $150,000</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                <select
                  value={manualProfile.education || ''}
                  onChange={(e) => setManualProfile(prev => ({...prev, education: e.target.value}))}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-green-500"
                >
                  <option value="High school diploma">High school diploma</option>
                  <option value="Some college">Some college</option>
                  <option value="Associate degree">Associate degree</option>
                  <option value="Bachelor's degree">Bachelor's degree</option>
                  <option value="Master's degree">Master's degree</option>
                  <option value="Doctoral degree">Doctoral degree</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shopping Behavior</label>
                <select
                  value={manualProfile.shoppingBehavior || ''}
                  onChange={(e) => setManualProfile(prev => ({...prev, shoppingBehavior: e.target.value}))}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-green-500"
                >
                  <option value="Researches extensively before purchasing">Researches extensively</option>
                  <option value="Impulse buyer influenced by promotions">Impulse buyer</option>
                  <option value="Brand loyal and prefers familiar products">Brand loyal</option>
                  <option value="Price-sensitive and comparison shops">Price-sensitive</option>
                  <option value="Values convenience and quick purchases">Values convenience</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lifestyle Description *</label>
              <textarea
                value={manualProfile.lifestyle || ''}
                onChange={(e) => setManualProfile(prev => ({...prev, lifestyle: e.target.value}))}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Describe their lifestyle, values, and general characteristics..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tech Savviness</label>
                <select
                  value={manualProfile.techSavviness || ''}
                  onChange={(e) => setManualProfile(prev => ({...prev, techSavviness: e.target.value}))}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-green-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Very High">Very High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environmental Awareness</label>
                <select
                  value={manualProfile.environmentalAwareness || ''}
                  onChange={(e) => setManualProfile(prev => ({...prev, environmentalAwareness: e.target.value}))}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-green-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Very High">Very High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Loyalty</label>
                <select
                  value={manualProfile.brandLoyalty || ''}
                  onChange={(e) => setManualProfile(prev => ({...prev, brandLoyalty: e.target.value}))}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-green-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Very High">Very High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Sensitivity</label>
                <select
                  value={manualProfile.pricesensitivity || ''}
                  onChange={(e) => setManualProfile(prev => ({...prev, pricesensitivity: e.target.value}))}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-green-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Very High">Very High</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={cancelManualRecruit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addManualProfile}
                disabled={!manualProfile.name || !manualProfile.lifestyle}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Participant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participant List */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Individual Participants</h3>
          <p className="text-gray-600">Review, edit, or exclude individual participants</p>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredProfiles.map((profile) => (
            <div 
              key={profile.id} 
              className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                excludedProfiles.has(profile.id) ? 'bg-red-50 opacity-50' : ''
              }`}
            >
              {editingProfile === profile.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={editedProfile?.name || ''}
                        onChange={(e) => setEditedProfile(prev => prev ? {...prev, name: e.target.value} : null)}
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                      <input
                        type="number"
                        value={editedProfile?.age || ''}
                        onChange={(e) => setEditedProfile(prev => prev ? {...prev, age: parseInt(e.target.value)} : null)}
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={editedProfile?.gender || ''}
                        onChange={(e) => setEditedProfile(prev => prev ? {...prev, gender: e.target.value} : null)}
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <select
                        value={editedProfile?.location || ''}
                        onChange={(e) => setEditedProfile(prev => prev ? {...prev, location: e.target.value} : null)}
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
                      >
                        <option value="Urban">Urban</option>
                        <option value="Suburban">Suburban</option>
                        <option value="Rural">Rural</option>
                        <option value="Metropolitan">Metropolitan</option>
                        <option value="Small Town">Small Town</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lifestyle</label>
                    <textarea
                      value={editedProfile?.lifestyle || ''}
                      onChange={(e) => setEditedProfile(prev => prev ? {...prev, lifestyle: e.target.value} : null)}
                      className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
                      rows={2}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={saveEdit}
                      className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="font-bold text-lg text-gray-900">
                        {profile.name || 'Unnamed Participant'}
                      </span>
                      <span className="font-medium text-gray-700">
                        {profile.age}y, {profile.gender}, {profile.location}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-sm text-gray-600">
                        {profile.income} • {profile.education}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{profile.lifestyle}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                      <div className="text-xs">
                        <span className="font-semibold text-gray-600">Tech:</span>
                        <span className="text-gray-700 ml-1">{profile.techSavviness}</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-gray-600">Environmental:</span>
                        <span className="text-gray-700 ml-1">{profile.environmentalAwareness}</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-gray-600">Brand Loyalty:</span>
                        <span className="text-gray-700 ml-1">{profile.brandLoyalty}</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-gray-600">Price Sensitivity:</span>
                        <span className="text-gray-700 ml-1">{profile.pricesensitivity}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      <span className="font-semibold">Shopping:</span> {profile.shoppingBehavior}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold">Interests:</span> {profile.interests.join(', ')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditing(profile)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                      title="Edit participant"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {excludedProfiles.has(profile.id) ? (
                      <button
                        onClick={() => includeProfile(profile.id)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded"
                        title="Include participant"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => excludeProfile(profile.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                        title="Exclude participant"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
