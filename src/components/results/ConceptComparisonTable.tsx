'use client';

import React, { useMemo, useState } from 'react';
import { Concept, PreferenceAnalysis, Question } from '@/types';
import { ArrowUpDown, Trophy } from 'lucide-react';

interface ConceptComparisonTableProps {
  concepts: Concept[];
  analyses: PreferenceAnalysis[];
  questions: Question[];
}

type SortKey = 'name' | 'overall' | string; // string for question IDs
type SortDir = 'asc' | 'desc';

export default function ConceptComparisonTable({
  concepts,
  analyses,
  questions,
}: ConceptComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('overall');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const scaleQuestions = useMemo(
    () => questions.filter(q => (q.type === 'scale_1_5' || q.type === 'scale_1_10') && q.enabled),
    [questions]
  );

  const conceptData = useMemo(() => {
    return concepts.map(concept => {
      const conceptAnalyses = analyses.filter(a => a.conceptId === concept.id);

      const questionScores: Record<string, { avg: number; max: number }> = {};
      scaleQuestions.forEach(q => {
        const responses = conceptAnalyses
          .map(a => (a.questionResponses ? Number(a.questionResponses[q.id]) : NaN))
          .filter(n => !isNaN(n));
        const avg = responses.length > 0 ? responses.reduce((s, r) => s + r, 0) / responses.length : 0;
        questionScores[q.id] = {
          avg,
          max: q.type === 'scale_1_5' ? 5 : 10,
        };
      });

      const allAvgs = Object.values(questionScores).map(s => s.avg).filter(a => a > 0);
      const overall = allAvgs.length > 0 ? allAvgs.reduce((s, a) => s + a, 0) / allAvgs.length : 0;

      return {
        concept,
        questionScores,
        overall,
        responseCount: conceptAnalyses.length,
      };
    });
  }, [concepts, analyses, scaleQuestions]);

  const sortedData = useMemo(() => {
    const sorted = [...conceptData].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      if (sortKey === 'name') {
        aVal = a.concept.title.toLowerCase();
        bVal = b.concept.title.toLowerCase();
        return sortDir === 'asc'
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      } else if (sortKey === 'overall') {
        aVal = a.overall;
        bVal = b.overall;
      } else {
        aVal = a.questionScores[sortKey]?.avg ?? 0;
        bVal = b.questionScores[sortKey]?.avg ?? 0;
      }

      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return sorted;
  }, [conceptData, sortKey, sortDir]);

  const topConceptId = useMemo(() => {
    if (conceptData.length === 0) return null;
    return conceptData.reduce((max, c) => (c.overall > max.overall ? c : max), conceptData[0]).concept.id;
  }, [conceptData]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortHeader = ({ label, sortKeyVal }: { label: string; sortKeyVal: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => handleSort(sortKeyVal)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortKey === sortKeyVal ? 'text-blue-600' : 'text-gray-400'}`} />
      </div>
    </th>
  );

  const getScoreColor = (avg: number, max: number) => {
    const pct = avg / max;
    if (pct >= 0.8) return 'text-green-700 bg-green-50';
    if (pct >= 0.6) return 'text-blue-700 bg-blue-50';
    if (pct >= 0.4) return 'text-yellow-700 bg-yellow-50';
    return 'text-red-700 bg-red-50';
  };

  if (concepts.length === 0 || analyses.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
        Concept Comparison
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader label="Concept" sortKeyVal="name" />
              <SortHeader label="Overall Avg" sortKeyVal="overall" />
              {scaleQuestions.map(q => (
                <SortHeader key={q.id} label={q.text} sortKeyVal={q.id} />
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Responses
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map(row => (
              <tr
                key={row.concept.id}
                className={`${row.concept.id === topConceptId ? 'bg-yellow-50/50' : 'hover:bg-gray-50'} transition-colors`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {row.concept.id === topConceptId && (
                      <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {row.concept.title}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${getScoreColor(row.overall, 10)}`}>
                    {row.overall.toFixed(1)}
                  </span>
                </td>
                {scaleQuestions.map(q => {
                  const score = row.questionScores[q.id];
                  return (
                    <td key={q.id} className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${getScoreColor(score.avg, score.max)}`}>
                        {score.avg.toFixed(1)}
                        <span className="text-xs ml-0.5 opacity-60">/{score.max}</span>
                      </span>
                    </td>
                  );
                })}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {row.responseCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
