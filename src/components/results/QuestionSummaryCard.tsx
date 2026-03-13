'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Concept, PreferenceAnalysis, Question, ConsumerProfile } from '@/types';
import { Hash, MessageSquare } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface QuestionSummaryCardProps {
  question: Question;
  concepts: Concept[];
  analyses: PreferenceAnalysis[];
  profiles: ConsumerProfile[];
}

const CONCEPT_COLORS = [
  { bg: 'rgba(79, 70, 229, 0.8)', border: 'rgba(79, 70, 229, 1)' },
  { bg: 'rgba(16, 185, 129, 0.8)', border: 'rgba(16, 185, 129, 1)' },
  { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgba(245, 158, 11, 1)' },
  { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgba(239, 68, 68, 1)' },
  { bg: 'rgba(139, 92, 246, 0.8)', border: 'rgba(139, 92, 246, 1)' },
  { bg: 'rgba(6, 182, 212, 0.8)', border: 'rgba(6, 182, 212, 1)' },
];

export default function QuestionSummaryCard({
  question,
  concepts,
  analyses,
  profiles,
}: QuestionSummaryCardProps) {
  const isScale = question.type === 'scale_1_5' || question.type === 'scale_1_10';
  const maxScale = question.type === 'scale_1_5' ? 5 : 10;

  // Scale question data
  const scaleData = useMemo(() => {
    if (!isScale) return null;

    const conceptStats = concepts.map(concept => {
      const conceptAnalyses = analyses.filter(
        a => a.conceptId === concept.id && a.questionResponses && a.questionResponses[question.id] !== undefined
      );
      const values = conceptAnalyses
        .map(a => Number(a.questionResponses![question.id]))
        .filter(n => !isNaN(n));

      if (values.length === 0) return { concept, avg: 0, min: 0, max: 0, median: 0, count: 0 };

      const sorted = [...values].sort((a, b) => a - b);
      const avg = values.reduce((s, v) => s + v, 0) / values.length;
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

      return {
        concept,
        avg,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        median,
        count: values.length,
      };
    });

    const allValues = analyses
      .filter(a => a.questionResponses && a.questionResponses[question.id] !== undefined)
      .map(a => Number(a.questionResponses![question.id]))
      .filter(n => !isNaN(n));

    const overallAvg = allValues.length > 0 ? allValues.reduce((s, v) => s + v, 0) / allValues.length : 0;

    return { conceptStats, overallAvg };
  }, [isScale, concepts, analyses, question.id]);

  // Open-ended data
  const openEndedData = useMemo(() => {
    if (question.type !== 'open_ended') return null;

    const grouped = concepts.map(concept => {
      const conceptAnalyses = analyses.filter(
        a => a.conceptId === concept.id && a.questionResponses && a.questionResponses[question.id]
      );
      const responses = conceptAnalyses.map(a => ({
        text: String(a.questionResponses![question.id]),
        profile: profiles.find(p => p.id === a.profileId),
      }));
      return { concept, responses };
    });

    const totalResponses = grouped.reduce((s, g) => s + g.responses.length, 0);
    return { grouped, totalResponses };
  }, [question, concepts, analyses, profiles]);

  // Chart data for scale questions
  const chartData = useMemo(() => {
    if (!scaleData) return null;
    return {
      labels: scaleData.conceptStats.map(s => s.concept.title),
      datasets: [
        {
          label: question.text,
          data: scaleData.conceptStats.map(s => s.avg),
          backgroundColor: scaleData.conceptStats.map((_, i) => CONCEPT_COLORS[i % CONCEPT_COLORS.length].bg),
          borderColor: scaleData.conceptStats.map((_, i) => CONCEPT_COLORS[i % CONCEPT_COLORS.length].border),
          borderWidth: 1,
        },
      ],
    };
  }, [scaleData, question.text]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: maxScale,
        ticks: { stepSize: maxScale === 5 ? 1 : 2 },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isScale ? (
            <Hash className="w-5 h-5 text-indigo-500" />
          ) : (
            <MessageSquare className="w-5 h-5 text-green-500" />
          )}
          <h4 className="text-md font-semibold text-gray-800">{question.text}</h4>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            question.type === 'scale_1_5' ? 'bg-blue-100 text-blue-700' :
            question.type === 'scale_1_10' ? 'bg-indigo-100 text-indigo-700' :
            'bg-green-100 text-green-700'
          }`}>
            {question.type === 'scale_1_5' ? '1-5 Scale' :
             question.type === 'scale_1_10' ? '1-10 Scale' :
             'Open Ended'}
          </span>
        </div>
        {isScale && scaleData && (
          <div className="text-right">
            <span className="text-sm text-gray-500">Overall Avg</span>
            <p className="text-2xl font-bold text-indigo-600">
              {scaleData.overallAvg.toFixed(1)}
              <span className="text-sm text-gray-400">/{maxScale}</span>
            </p>
          </div>
        )}
        {!isScale && openEndedData && (
          <span className="text-sm text-gray-500">{openEndedData.totalResponses} responses</span>
        )}
      </div>

      {/* Scale question content */}
      {isScale && scaleData && chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chart */}
          <div className="lg:col-span-2">
            <Bar data={chartData} options={chartOptions} />
          </div>
          {/* Stats */}
          <div className="space-y-2">
            {scaleData.conceptStats.map((stat, i) => (
              <div
                key={stat.concept.id}
                className="p-3 rounded-lg border"
                style={{ borderLeftColor: CONCEPT_COLORS[i % CONCEPT_COLORS.length].border, borderLeftWidth: '3px' }}
              >
                <p className="text-sm font-medium text-gray-700 truncate">{stat.concept.title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-bold text-gray-900">{stat.avg.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">
                    min {stat.min} · med {stat.median.toFixed(1)} · max {stat.max}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{stat.count} responses</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open-ended content */}
      {question.type === 'open_ended' && openEndedData && (
        <div className="space-y-4">
          {openEndedData.grouped.map((group, gi) => (
            <div key={group.concept.id}>
              <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: CONCEPT_COLORS[gi % CONCEPT_COLORS.length].border }}
                />
                {group.concept.title}
                <span className="text-xs text-gray-400 font-normal">({group.responses.length} responses)</span>
              </h5>
              <div className="max-h-48 overflow-y-auto space-y-2 pl-5">
                {group.responses.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-800">{item.text}</p>
                    {item.profile && (
                      <p className="text-xs text-gray-500 mt-1">
                        — {item.profile.name}, {item.profile.age}
                      </p>
                    )}
                  </div>
                ))}
                {group.responses.length > 5 && (
                  <p className="text-xs text-gray-400 italic">
                    + {group.responses.length - 5} more responses
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
