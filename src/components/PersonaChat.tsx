'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  AnalysisReport,
  ChatMessage,
  ChatMode,
  ConsumerProfile,
  SurveyContext,
} from '@/types';
import PersonaSelector from './chat/PersonaSelector';
import ChatWindow from './chat/ChatWindow';
import FocusGroupView from './chat/FocusGroupView';
import { MessageCircle, Users, User, ChevronDown, ChevronUp, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PersonaChatProps {
  report: AnalysisReport;
}

export default function PersonaChat({ report }: PersonaChatProps) {
  const { profiles, concepts, analyses, questions: reportQuestions } = report;
  const questions = useMemo(() => reportQuestions || [], [reportQuestions]);

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>('follow_up');
  const [selectedPersonas, setSelectedPersonas] = useState<ConsumerProfile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPersonaId, setLoadingPersonaId] = useState<string | null>(null);
  const [chatStarted, setChatStarted] = useState(false);

  // Build survey context for selected personas
  const surveyContext: SurveyContext = useMemo(() => {
    const selectedIds = new Set(selectedPersonas.map(p => p.id));
    return {
      concepts,
      questions,
      analyses: analyses.filter(a => selectedIds.has(a.profileId)),
    };
  }, [selectedPersonas, concepts, questions, analyses]);

  // Build conversation history for API calls
  const buildConversationHistory = useCallback(
    (personaId: string) => {
      return messages
        .filter(m => m.role === 'user' || m.personaId === personaId)
        .map(m => ({
          role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.content,
        }));
    },
    [messages]
  );

  // Detect if user is addressing a specific persona by name
  const findMentionedPersona = useCallback(
    (message: string): ConsumerProfile | null => {
      const lowerMsg = message.toLowerCase();
      for (const persona of selectedPersonas) {
        const firstName = persona.name.split(' ')[0].toLowerCase();
        if (firstName.length >= 3 && lowerMsg.includes(firstName)) {
          return persona;
        }
      }
      return null;
    },
    [selectedPersonas]
  );

  // Send message to a single persona via API
  const sendToPersona = useCallback(
    async (
      userMessage: string,
      persona: ConsumerProfile,
      conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
    ): Promise<string> => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          personaProfile: persona,
          surveyContext,
          conversationHistory,
          mode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    },
    [surveyContext, mode]
  );

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (selectedPersonas.length === 0) return;

      // Add user message
      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      try {
        if (mode === 'follow_up') {
          // Single persona mode
          const persona = selectedPersonas[0];
          setLoadingPersonaId(persona.id);
          const history = buildConversationHistory(persona.id);
          const response = await sendToPersona(message, persona, history);

          const personaMsg: ChatMessage = {
            id: uuidv4(),
            role: 'persona',
            personaId: persona.id,
            personaName: persona.name,
            content: response,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, personaMsg]);
        } else {
          // Focus group mode
          const mentionedPersona = findMentionedPersona(message);
          const respondingPersonas = mentionedPersona
            ? [mentionedPersona]
            : selectedPersonas;

          for (const persona of respondingPersonas) {
            setLoadingPersonaId(persona.id);
            const history = buildConversationHistory(persona.id);

            try {
              const response = await sendToPersona(message, persona, history);
              const personaMsg: ChatMessage = {
                id: uuidv4(),
                role: 'persona',
                personaId: persona.id,
                personaName: persona.name,
                content: response,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, personaMsg]);
            } catch (err) {
              console.error(`Error getting response from ${persona.name}:`, err);
              const errorMsg: ChatMessage = {
                id: uuidv4(),
                role: 'persona',
                personaId: persona.id,
                personaName: persona.name,
                content: `[Error: Could not get a response from ${persona.name}. Please try again.]`,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, errorMsg]);
            }
          }
        }
      } catch (err) {
        console.error('Chat error:', err);
      } finally {
        setIsLoading(false);
        setLoadingPersonaId(null);
      }
    },
    [selectedPersonas, mode, buildConversationHistory, findMentionedPersona, sendToPersona]
  );

  const handleStartChat = () => {
    setChatStarted(true);
    setMessages([]);
  };

  const handleResetChat = () => {
    setChatStarted(false);
    setMessages([]);
    setSelectedPersonas([]);
  };

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
    setSelectedPersonas([]);
    setMessages([]);
    setChatStarted(false);
  };

  const canStartChat =
    (mode === 'follow_up' && selectedPersonas.length === 1) ||
    (mode === 'focus_group' && selectedPersonas.length >= 2);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-indigo-600" />
          <div className="text-left">
            <h3 className="text-xl font-bold text-gray-800">Chat with Personas</h3>
            <p className="text-sm text-gray-500">
              Ask follow-up questions or run a focus group discussion
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="border-t">
          {/* Mode toggle */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleModeChange('follow_up')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'follow_up'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                <User className="w-4 h-4" />
                Follow-Up Questions
              </button>
              <button
                onClick={() => handleModeChange('focus_group')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'focus_group'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4" />
                Focus Group
              </button>

              {chatStarted && (
                <button
                  onClick={handleResetChat}
                  className="ml-auto flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Reset Chat
                </button>
              )}
            </div>
          </div>

          {!chatStarted ? (
            <div className="p-4 space-y-4">
              {/* Persona selector */}
              <PersonaSelector
                profiles={profiles}
                mode={mode}
                selectedPersonas={selectedPersonas}
                onSelectionChange={setSelectedPersonas}
              />

              {/* Start button */}
              <div className="flex justify-end">
                <button
                  onClick={handleStartChat}
                  disabled={!canStartChat}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {mode === 'follow_up' ? 'Start Conversation' : 'Start Focus Group'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {mode === 'follow_up' ? (
                <ChatWindow
                  messages={messages}
                  isLoading={isLoading}
                  onSendMessage={handleSendMessage}
                  placeholder={`Ask ${selectedPersonas[0]?.name.split(' ')[0]} a question...`}
                />
              ) : (
                <FocusGroupView
                  messages={messages}
                  personas={selectedPersonas}
                  isLoading={isLoading}
                  loadingPersonaId={loadingPersonaId}
                  onSendMessage={handleSendMessage}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
