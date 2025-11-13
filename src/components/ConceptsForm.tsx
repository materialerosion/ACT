'use client';

import React, { useState } from 'react';
import { Concept } from '@/types';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ConceptsFormProps {
  onSubmit: (concepts: Concept[]) => void;
  isLoading?: boolean;
}

export default function ConceptsForm({ onSubmit, isLoading }: ConceptsFormProps) {
  const [concepts, setConcepts] = useState<Concept[]>([
    {
      id: uuidv4(),
      title: '',
      description: '',
    },
  ]);

  const addConcept = () => {
    setConcepts([
      ...concepts,
      {
        id: uuidv4(),
        title: '',
        description: '',
      },
    ]);
  };

  const removeConcept = (id: string) => {
    if (concepts.length > 1) {
      setConcepts(concepts.filter(concept => concept.id !== id));
    }
  };

  const updateConcept = (id: string, field: 'title' | 'description', value: string) => {
    setConcepts(concepts.map(concept =>
      concept.id === id ? { ...concept, [field]: value } : concept
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty concepts
    const validConcepts = concepts.filter(concept => 
      concept.title.trim() && concept.description.trim()
    );
    
    if (validConcepts.length === 0) {
      alert('Please add at least one complete concept with both title and description.');
      return;
    }
    
    onSubmit(validConcepts);
  };

  const sampleConcepts = [
    {
      title: "Eco-Friendly Packaging",
      description: "Our product uses 100% recyclable and biodegradable packaging materials, reducing environmental impact by 75% compared to traditional packaging."
    },
    {
      title: "Advanced Formula Technology",
      description: "Featuring breakthrough micro-encapsulation technology that delivers 3x longer-lasting results than leading competitors."
    },
    {
      title: "Premium Natural Ingredients",
      description: "Made with organic, sustainably-sourced ingredients including rare botanical extracts for superior quality and effectiveness."
    },
  ];

  const useSampleConcept = (sampleConcept: { title: string; description: string }) => {
    const emptyConcept = concepts.find(concept => !concept.title && !concept.description);
    if (emptyConcept) {
      updateConcept(emptyConcept.id, 'title', sampleConcept.title);
      updateConcept(emptyConcept.id, 'description', sampleConcept.description);
    } else {
      setConcepts([
        ...concepts,
        {
          id: uuidv4(),
          title: sampleConcept.title,
          description: sampleConcept.description,
        },
      ]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Concepts to Test</h2>
        <p className="text-gray-600">
          Add the product concepts you want to test against the generated consumer profiles. Each concept will be analyzed for preference, innovativeness, and differentiation.
        </p>
      </div>

      {/* Sample Concepts */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Sample Concepts (Click to Use)</h3>
        <div className="grid gap-3">
          {sampleConcepts.map((sample, index) => (
            <button
              key={index}
              onClick={() => useSampleConcept(sample)}
              className="text-left p-3 bg-white rounded border border-blue-200 hover:border-blue-400 transition-colors"
            >
              <div className="font-medium text-blue-800">{sample.title}</div>
              <div className="text-sm text-blue-600 mt-1">{sample.description}</div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {concepts.map((concept, index) => (
          <div key={concept.id} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Concept {index + 1}
                </h3>
              </div>
              {concepts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeConcept(concept.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concept Title
                </label>
                <input
                  type="text"
                  value={concept.title}
                  onChange={(e) => updateConcept(concept.id, 'title', e.target.value)}
                  placeholder="e.g., Revolutionary New Formula"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description
                </label>
                <textarea
                  value={concept.description}
                  onChange={(e) => updateConcept(concept.id, 'description', e.target.value)}
                  placeholder="Provide a detailed description of the concept, including key benefits, features, or value propositions..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add Concept Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={addConcept}
            className="flex items-center px-4 py-2 text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Concept
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analyzing Concepts...
              </>
            ) : (
              'Analyze Consumer Preferences'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}