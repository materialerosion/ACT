
'use client';

import React, { useState, useRef } from 'react';
import { Concept, Question, ResponseType } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, MessageSquare, Image as ImageIcon, X, ChevronDown, ChevronUp } from 'lucide-react';

interface DesignSurveyProps {
  onSubmit: (concepts: Concept[], questions: Question[]) => void;
  isLoading: boolean;
}

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

// Convert WebP/GIF to PNG via canvas for grok-3 compatibility
async function convertToCompatibleFormat(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      
      // PNG and JPEG are universally supported — pass through
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, mimeType: file.type });
        return;
      }
      
      // WebP and GIF need conversion to PNG for grok-3 compatibility
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const pngDataUrl = canvas.toDataURL('image/png');
        const base64 = pngDataUrl.split(',')[1];
        resolve({ base64, mimeType: 'image/png' });
      };
      img.onerror = () => reject(new Error('Failed to load image for conversion'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

const responseTypeLabels: Record<ResponseType, { label: string; color: string }> = {
  'scale_1_5': { label: '1-5 Scale', color: 'bg-blue-100 text-blue-700' },
  'scale_1_10': { label: '1-10 Scale', color: 'bg-indigo-100 text-indigo-700' },
  'open_ended': { label: 'Open Ended', color: 'bg-green-100 text-green-700' },
  'rank_order': { label: 'Rank Order', color: 'bg-orange-100 text-orange-700' },
};

const DesignSurvey: React.FC<DesignSurveyProps> = ({ onSubmit, isLoading }) => {
  const [concepts, setConcepts] = useState<Concept[]>([
    {
      id: uuidv4(),
      title: '',
      description: '',
    },
  ]);

  const [questions, setQuestions] = useState<Question[]>([
    { id: 'preference', text: 'Preference', type: 'scale_1_10', enabled: true },
    { id: 'innovativeness', text: 'Innovativeness', type: 'scale_1_10', enabled: true },
    { id: 'differentiation', text: 'Differentiation', type: 'scale_1_10', enabled: true },
    { id: 'rationale', text: 'Rationale', type: 'open_ended', enabled: true },
    { id: 'value_perception', text: 'Value for Money', type: 'scale_1_5', enabled: false },
    { id: 'purchase_intent', text: 'Likelihood to Purchase', type: 'scale_1_5', enabled: false },
  ]);

  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<ResponseType>('open_ended');
  const [collapsedConcepts, setCollapsedConcepts] = useState<Set<string>>(new Set());
  const [imageUploading, setImageUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
      setCollapsedConcepts(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const updateConcept = (id: string, field: 'title' | 'description', value: string) => {
    setConcepts(prev => prev.map(concept =>
      concept.id === id ? { ...concept, [field]: value } : concept
    ));
  };

  const handleImageUpload = async (conceptId: string, file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      alert('Please upload a PNG, JPEG, WebP, or GIF image.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      alert(`Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    setImageUploading(conceptId);
    try {
      const { base64, mimeType } = await convertToCompatibleFormat(file);
      setConcepts(prev => prev.map(concept =>
        concept.id === conceptId
          ? { ...concept, imageBase64: base64, imageMimeType: mimeType }
          : concept
      ));
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to process image. Please try a different file.');
    } finally {
      setImageUploading(null);
    }
  };

  const removeImage = (conceptId: string) => {
    setConcepts(prev => prev.map(concept =>
      concept.id === conceptId
        ? { ...concept, imageBase64: undefined, imageMimeType: undefined }
        : concept
    ));
  };

  const toggleConceptCollapse = (id: string) => {
    setCollapsedConcepts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleQuestion = (id: string) => {
    setQuestions(
      questions.map(q =>
        q.id === id ? { ...q, enabled: !q.enabled } : q
      )
    );
  };

  const addQuestion = () => {
    if (newQuestionText.trim() === '') return;
    const newQuestion: Question = {
      id: uuidv4(),
      text: newQuestionText.trim(),
      type: newQuestionType,
      enabled: true,
    };
    setQuestions([...questions, newQuestion]);
    setNewQuestionText('');
    setNewQuestionType('open_ended');
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const isDefaultQuestion = (id: string) => {
    return ['preference', 'innovativeness', 'differentiation', 'rationale', 'value_perception', 'purchase_intent'].includes(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validConcepts = concepts.filter(concept => 
      concept.title.trim() && concept.description.trim()
    );
    
    if (validConcepts.length === 0) {
      alert('Please add at least one complete concept with both title and description.');
      return;
    }
    onSubmit(validConcepts, questions.filter(q => q.enabled));
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

  const handleUseSampleConcept = (sampleConcept: { title: string; description: string }) => {
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

  const enabledQuestionCount = questions.filter(q => q.enabled).length;
  const validConceptCount = concepts.filter(c => c.title.trim() && c.description.trim()).length;
  
  return (
    <div className="max-w-6xl mx-auto transition-all duration-500 ease-in-out">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Design Survey</h2>
      <p className="text-gray-500 mb-8">Define your product concepts and choose the questions to ask each consumer profile.</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column — Concepts (3/5 width) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <MessageSquare className="w-5 h-5 text-green-600 mr-2" />
                Product Concepts
                <span className="ml-2 text-sm font-normal text-gray-500">({validConceptCount} valid)</span>
              </h3>
              <button
                type="button"
                onClick={addConcept}
                className="flex items-center px-3 py-1.5 text-sm text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Concept
              </button>
            </div>

            {/* Sample Concepts */}
            <div className="mb-5 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Sample Concepts (Click to Use)</h4>
              <div className="flex flex-wrap gap-2">
                {sampleConcepts.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => handleUseSampleConcept(sample)}
                    className="text-left px-3 py-1.5 text-xs bg-white rounded border border-blue-200 hover:border-blue-400 transition-colors"
                    title={sample.description}
                  >
                    <span className="font-medium text-blue-800">{sample.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Concept Cards */}
            <div className="space-y-4">
              {concepts.map((concept, index) => {
                const isCollapsed = collapsedConcepts.has(concept.id);
                
                return (
                  <div key={concept.id} className="bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden">
                    {/* Concept Header */}
                    <div 
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleConceptCollapse(concept.id)}
                    >
                      <div className="flex items-center min-w-0">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center mr-3">
                          {index + 1}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 truncate">
                          {concept.title || `Concept ${index + 1}`}
                        </span>
                        {concept.imageBase64 && (
                          <span className="ml-2 flex-shrink-0">
                            <ImageIcon className="w-4 h-4 text-blue-500" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {concepts.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeConcept(concept.id); }}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {isCollapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {/* Concept Body */}
                    {!isCollapsed && (
                      <div className="px-4 pb-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={concept.title}
                            onChange={(e) => updateConcept(concept.id, 'title', e.target.value)}
                            placeholder="e.g., Revolutionary New Formula"
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={concept.description}
                            onChange={(e) => updateConcept(concept.id, 'description', e.target.value)}
                            placeholder="Provide a detailed description of the concept..."
                            rows={3}
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
                          />
                        </div>

                        {/* Image Upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Concept Image <span className="text-gray-400 font-normal">(optional — will be analyzed by AI)</span>
                          </label>
                          
                          {concept.imageBase64 ? (
                            <div className="relative inline-block">
                              <img
                                src={`data:${concept.imageMimeType};base64,${concept.imageBase64}`}
                                alt={`${concept.title} concept`}
                                className="w-40 h-40 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(concept.id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div
                              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                                imageUploading === concept.id
                                  ? 'border-blue-400 bg-blue-50'
                                  : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                              }`}
                              onClick={() => fileInputRefs.current[concept.id]?.click()}
                              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const file = e.dataTransfer.files[0];
                                if (file) handleImageUpload(concept.id, file);
                              }}
                            >
                              <input
                                ref={(el) => { fileInputRefs.current[concept.id] = el; }}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(concept.id, file);
                                  e.target.value = ''; // Reset so same file can be re-selected
                                }}
                              />
                              {imageUploading === concept.id ? (
                                <p className="text-sm text-blue-600">Processing image...</p>
                              ) : (
                                <>
                                  <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-500">
                                    Click or drag & drop an image
                                  </p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    PNG, JPEG, WebP, GIF — max {MAX_IMAGE_SIZE_MB}MB
                                  </p>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column — Questions (2/5 width) */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 sticky top-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-1">Survey Questions</h3>
            <p className="text-sm text-gray-500 mb-4">
              {enabledQuestionCount} question{enabledQuestionCount !== 1 ? 's' : ''} enabled
            </p>

            {/* Add Custom Question */}
            <div className="mb-5 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Add Custom Question</h4>
              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="E.g., How does this make you feel?"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 mb-2"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addQuestion(); } }}
              />
              <div className="flex gap-2">
                <select
                  value={newQuestionType}
                  onChange={(e) => setNewQuestionType(e.target.value as ResponseType)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="open_ended">Open-Ended</option>
                  <option value="scale_1_5">Scale 1-5</option>
                  <option value="scale_1_10">Scale 1-10</option>
                </select>
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={!newQuestionText.trim()}
                  className="px-4 py-2 text-sm bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </button>
              </div>
            </div>

            {/* Question List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {questions.map(question => (
                <div
                  key={question.id}
                  className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                    question.enabled 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center min-w-0 cursor-pointer" onClick={() => toggleQuestion(question.id)}>
                    <input
                      type="checkbox"
                      checked={question.enabled}
                      onChange={() => {}}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                    />
                    <div className="ml-3 min-w-0">
                      <span className="text-sm font-medium text-gray-800 block truncate">
                        {question.text}
                      </span>
                      <span className={`inline-block mt-0.5 px-1.5 py-0.5 text-xs font-medium rounded ${responseTypeLabels[question.type].color}`}>
                        {responseTypeLabels[question.type].label}
                      </span>
                    </div>
                  </div>
                  {!isDefaultQuestion(question.id) && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded flex-shrink-0 ml-2"
                      aria-label="Remove question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <form onSubmit={handleSubmit}>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={isLoading || enabledQuestionCount === 0 || validConceptCount === 0}
                >
                  {isLoading ? 'Analyzing...' : `Start Analysis (${validConceptCount} concept${validConceptCount !== 1 ? 's' : ''}, ${enabledQuestionCount} question${enabledQuestionCount !== 1 ? 's' : ''})`}
                </button>
                {(validConceptCount === 0 || enabledQuestionCount === 0) && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    {validConceptCount === 0 ? 'Add at least one concept with title and description. ' : ''}
                    {enabledQuestionCount === 0 ? 'Enable at least one question.' : ''}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignSurvey;
