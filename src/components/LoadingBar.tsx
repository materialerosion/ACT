'use client';

import React from 'react';

interface LoadingBarProps {
  progress: number; // 0-100
  message?: string;
  subMessage?: string;
}

export default function LoadingBar({ progress, message, subMessage }: LoadingBarProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      {message && (
        <div className="text-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{message}</h3>
          {subMessage && (
            <p className="text-sm text-gray-600">{subMessage}</p>
          )}
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] animate-shimmer"></div>
        </div>
      </div>
      
      <div className="text-center mt-2">
        <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}