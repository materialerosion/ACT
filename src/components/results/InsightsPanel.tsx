'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';

interface InsightsPanelProps {
  insights: string[];
}

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
        Key Insights
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <div key={index} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
            <p className="text-gray-700">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
