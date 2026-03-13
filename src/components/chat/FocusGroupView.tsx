'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ConsumerProfile } from '@/types';
import { Send, Loader2 } from 'lucide-react';

interface FocusGroupViewProps {
  messages: ChatMessage[];
  personas: ConsumerProfile[];
  isLoading: boolean;
  loadingPersonaId?: string | null;
  onSendMessage: (message: string) => void;
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500',
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function FocusGroupView({
  messages,
  personas,
  isLoading,
  loadingPersonaId,
  onSendMessage,
}: FocusGroupViewProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingPersonaId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[550px]">
      {/* Participants bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50 overflow-x-auto">
        <span className="text-xs text-gray-500 font-medium flex-shrink-0">Participants:</span>
        {personas.map(p => (
          <div
            key={p.id}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
              loadingPersonaId === p.id
                ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full ${getAvatarColor(p.id)} flex items-center justify-center text-white text-[10px] font-bold`}
            >
              {getInitials(p.name)}
            </div>
            {p.name.split(' ')[0]}
            {loadingPersonaId === p.id && (
              <Loader2 className="w-3 h-3 animate-spin" />
            )}
          </div>
        ))}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center">
            <div>
              <p>Ask a question to the focus group.</p>
              <p className="text-xs mt-1">All participants will respond. Mention a name to ask a specific person.</p>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'persona' && (
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full ${getAvatarColor(msg.personaId || '')} flex items-center justify-center text-white text-xs font-bold mr-2 mt-1`}
              >
                {getInitials(msg.personaName || 'AI')}
              </div>
            )}

            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}
            >
              {msg.role === 'persona' && msg.personaName && (
                <p className="text-xs font-semibold text-indigo-600 mb-1">{msg.personaName}</p>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>

            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold ml-2 mt-1">
                You
              </div>
            )}
          </div>
        ))}

        {isLoading && loadingPersonaId && (
          <div className="flex justify-start">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full ${getAvatarColor(loadingPersonaId)} flex items-center justify-center text-white text-xs font-bold mr-2 mt-1`}
            >
              {getInitials(personas.find(p => p.id === loadingPersonaId)?.name || 'AI')}
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                {personas.find(p => p.id === loadingPersonaId)?.name.split(' ')[0]} is thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask the focus group a question..."
          disabled={isLoading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
