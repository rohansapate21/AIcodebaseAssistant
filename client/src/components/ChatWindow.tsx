import React, { useState, useRef, useEffect } from 'react';
import type { Message, Citation } from '../types';
import { MessageBubble } from './MessageBubble';
import { CodeInspectorDrawer } from './CodeInspectorDrawer';

interface Props {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (question: string) => void;
  disabled?: boolean;
  suggestedQueries?: string[];
}

const DEFAULT_QUESTIONS = [
  'How is authentication and session handling implemented?',
  'Where are the primary API routes and controllers configured?',
  'Explain the data models and database connection logic.',
  'What third-party services and APIs are integrated?',
];

export const ChatWindow: React.FC<Props> = ({
  messages,
  isLoading,
  error,
  onSendMessage,
  disabled = false,
  suggestedQueries,
}) => {
  const [input, setInput] = useState('');
  const [inspectingCitation, setInspectingCitation] = useState<Citation | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const displaySuggestions = suggestedQueries && suggestedQueries.length > 0
    ? suggestedQueries
    : DEFAULT_QUESTIONS;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleSuggestionClick = (question: string) => {
    if (!isLoading && !disabled) {
      onSendMessage(question);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950/60 border-b border-zinc-800 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${disabled ? 'bg-zinc-600' : 'bg-emerald-400'}`} />
          <span className="font-medium text-zinc-300">
            {disabled ? 'Awaiting Indexed Repository' : 'Codebase Q&A Active'}
          </span>
        </div>
        <div className="text-zinc-500 font-mono text-[11px]">
          Gemini RAG + MongoDB Vector Search
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-zinc-200 mb-1">
              {disabled ? 'Index a repository above to start chatting' : 'Ask anything about the codebase'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mb-6">
              Answers are grounded directly on retrieved code chunks with verified GitHub source citations.
            </p>

            {!disabled && (
              <div className="w-full max-w-lg space-y-2 text-left">
                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
                  Suggested inquiries
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {displaySuggestions.map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSuggestionClick(q)}
                      className="text-left px-3.5 py-2.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 text-xs text-zinc-300 hover:text-purple-300 border border-zinc-800/80 hover:border-purple-500/40 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <span className="truncate">{q}</span>
                      <span className="text-zinc-500 group-hover:text-purple-400 transition-colors ml-2">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {messages.map(message => (
          <MessageBubble
            key={message.id}
            message={message}
            onSelectCitation={setInspectingCitation}
          />
        ))}

        {isLoading && (
          <div className="flex w-full justify-start mb-4 px-2">
            <div className="rounded-2xl px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-bl-xs text-zinc-200 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span className="text-xs text-zinc-400 font-mono">
                Searching vector index &amp; generating grounded response…
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Bottom input area */}
      <form onSubmit={handleSubmit} className="p-3 md:p-4 bg-zinc-950/80 border-t border-zinc-800 flex gap-2">
        <input
          id="chat-question-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={disabled ? 'Index a repository first to enable queries…' : 'Ask a question about this repository…'}
          disabled={isLoading || disabled}
          className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-zinc-100 placeholder-zinc-500 rounded-xl text-sm transition-all outline-none disabled:opacity-50"
          aria-label="Question input"
        />
        <button
          id="chat-send-btn"
          type="submit"
          disabled={isLoading || disabled || !input.trim()}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 text-white text-sm font-semibold rounded-xl shadow-md transition-all duration-150 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
        >
          <span>Ask</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>

      {/* In-app code drawer */}
      <CodeInspectorDrawer
        citation={inspectingCitation}
        onClose={() => setInspectingCitation(null)}
      />
    </div>
  );
};
