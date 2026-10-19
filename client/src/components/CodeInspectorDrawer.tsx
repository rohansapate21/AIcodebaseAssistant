import React, { useState, useEffect } from 'react';
import type { Citation } from '../types';

interface Props {
  citation: Citation | null;
  onClose: () => void;
}

export const CodeInspectorDrawer: React.FC<Props> = ({ citation, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (citation) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [citation, onClose]);

  if (!citation) return null;

  const handleCopy = async () => {
    if (citation.content) {
      await navigator.clipboard.writeText(citation.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = citation.content ? citation.content.split('\n') : [];
  const startLine = citation.startLine || 1;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-100 truncate" title={citation.filePath}>
                {citation.filePath.split('/').pop()}
              </h3>
              <p className="text-[11px] font-mono text-zinc-400 truncate">{citation.filePath}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              L{citation.startLine}–L{citation.endLine}
            </span>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-colors cursor-pointer"
              title="Copy code"
            >
              {copied ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-sans px-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>

            <a
              href={citation.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-300 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-colors cursor-pointer"
              title="Open file on GitHub"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer ml-1"
              title="Close drawer (Esc)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-[#0e1015]">
          {citation.content ? (
            <div className="font-mono text-xs leading-relaxed select-text flex">
              {/* Line numbers column */}
              <div className="select-none text-right pr-4 text-zinc-600 border-r border-zinc-800/80 mr-4 font-mono">
                {lines.map((_, i) => (
                  <div key={i} className="py-0.5">
                    {startLine + i}
                  </div>
                ))}
              </div>
              {/* Code lines */}
              <div className="flex-1 overflow-x-auto text-zinc-200">
                {lines.map((line, i) => (
                  <div key={i} className="py-0.5 whitespace-pre">
                    {line || '\n'}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 py-12">
              <p className="text-sm">Snippet preview not available in metadata.</p>
              <a
                href={citation.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 text-xs text-purple-400 hover:underline"
              >
                View directly on GitHub →
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400">
          <span className="font-mono text-[11px] text-zinc-500">
            {citation.language ? `Syntax: ${citation.language}` : 'Code snippet'}
          </span>
          <a
            href={citation.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            <span>View full file on GitHub</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};
