import React, { useState } from 'react';
import type { RepoStatusResponse } from '../types';

interface Props {
  status: RepoStatusResponse;
  onSelectQuery: (query: string) => void;
}

export const RepoOverview: React.FC<Props> = ({ status, onSelectQuery }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const summary = status.architectureSummary;

  if (!summary) return null;

  return (
    <div className="w-full bg-zinc-900/80 border border-zinc-800/90 rounded-2xl shadow-lg backdrop-blur-sm overflow-hidden transition-all duration-200">
      {/* Header Banner */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950/70 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Repository Intelligence
            </span>
            <span className="text-xs text-zinc-500 ml-2 font-mono">
              ({status.fileCount} files · {status.chunkCount} vector chunks)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(prev => !prev)}
          className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-5 space-y-4">
          {/* Overview text */}
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
            {summary.overview}
          </p>

          {/* Tech Stack Pills */}
          {summary.techStack && summary.techStack.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Detected Stack
              </span>
              <div className="flex flex-wrap gap-1.5">
                {summary.techStack.map(tech => (
                  <span
                    key={tech}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/25 shadow-xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Modules Map */}
          {summary.keyModules && summary.keyModules.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Architecture &amp; Core Modules
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {summary.keyModules.map(mod => (
                  <div
                    key={mod.path}
                    className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-zinc-200">{mod.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[140px]" title={mod.path}>
                        {mod.path}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-normal">{mod.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Inquiries */}
          {summary.suggestedQueries && summary.suggestedQueries.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                One-Click Explorations
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {summary.suggestedQueries.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onSelectQuery(q)}
                    className="text-left text-xs px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-purple-300 border border-zinc-700/60 hover:border-purple-500/40 transition-all cursor-pointer flex items-center gap-1.5 group"
                  >
                    <span className="text-purple-400 group-hover:translate-x-0.5 transition-transform">✦</span>
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
