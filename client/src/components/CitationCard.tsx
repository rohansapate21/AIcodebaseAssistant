import React from 'react';
import type { Citation } from '../types';

interface Props {
  citation: Citation;
  onSelect?: (citation: Citation) => void;
}

export const CitationCard: React.FC<Props> = ({ citation, onSelect }) => {
  const label = `${citation.filePath}:${citation.startLine}-${citation.endLine}`;

  const handleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(citation);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-300 hover:text-purple-300 border border-zinc-700/80 hover:border-purple-500/50 shadow-sm transition-all duration-150 group">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 cursor-pointer text-left focus:outline-none"
        title="Inspect code in drawer"
      >
        <svg
          className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span className="truncate max-w-[200px]">{label}</span>
      </button>

      {/* Direct GitHub link icon */}
      <a
        href={citation.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="text-zinc-500 hover:text-purple-300 transition-colors p-0.5 rounded hover:bg-zinc-700 ml-0.5"
        title="Open directly on GitHub"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>
  );
};
