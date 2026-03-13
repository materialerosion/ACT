'use client';

import React, { useState, useMemo } from 'react';
import { ConsumerProfile, ChatMode } from '@/types';
import { Search, Check, User } from 'lucide-react';

interface PersonaSelectorProps {
  profiles: ConsumerProfile[];
  mode: ChatMode;
  selectedPersonas: ConsumerProfile[];
  onSelectionChange: (personas: ConsumerProfile[]) => void;
}

const MAX_FOCUS_GROUP = 6;

export default function PersonaSelector({
  profiles,
  mode,
  selectedPersonas,
  onSelectionChange,
}: PersonaSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles;
    const q = searchQuery.toLowerCase();
    return profiles.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.gender.toLowerCase().includes(q) ||
        p.income.toLowerCase().includes(q)
    );
  }, [profiles, searchQuery]);

  const selectedIds = new Set(selectedPersonas.map(p => p.id));

  const togglePersona = (profile: ConsumerProfile) => {
    if (mode === 'follow_up') {
      // Single select
      if (selectedIds.has(profile.id)) {
        onSelectionChange([]);
      } else {
        onSelectionChange([profile]);
      }
    } else {
      // Multi select up to MAX_FOCUS_GROUP
      if (selectedIds.has(profile.id)) {
        onSelectionChange(selectedPersonas.filter(p => p.id !== profile.id));
      } else if (selectedPersonas.length < MAX_FOCUS_GROUP) {
        onSelectionChange([...selectedPersonas, profile]);
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const AVATAR_COLORS = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
    'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500',
  ];

  const getAvatarColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };

  return (
    <div>
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, location, gender..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Selection info */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">
          {mode === 'follow_up'
            ? 'Select 1 persona for follow-up questions'
            : `Select up to ${MAX_FOCUS_GROUP} personas for focus group (${selectedPersonas.length}/${MAX_FOCUS_GROUP})`}
        </p>
        {selectedPersonas.length > 0 && (
          <button
            onClick={() => onSelectionChange([])}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Profile grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
        {filteredProfiles.map(profile => {
          const isSelected = selectedIds.has(profile.id);
          const isDisabled = !isSelected && mode === 'focus_group' && selectedPersonas.length >= MAX_FOCUS_GROUP;

          return (
            <button
              key={profile.id}
              onClick={() => !isDisabled && togglePersona(profile)}
              disabled={isDisabled}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : isDisabled
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              {/* Avatar */}
              <div className={`relative flex-shrink-0 w-10 h-10 rounded-full ${getAvatarColor(profile.id)} flex items-center justify-center text-white text-sm font-bold`}>
                {getInitials(profile.name)}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{profile.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {profile.age} · {profile.gender} · {profile.location}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {filteredProfiles.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          <User className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No profiles match your search</p>
        </div>
      )}
    </div>
  );
}
