import React, { useState } from 'react';
import type { RepoStatusResponse } from '../types';

interface Props {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  status: RepoStatusResponse | null;
  error: string | null;
}

export const RepoInput: React.FC<Props> = ({ onSubmit, isLoading, status, error }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  const isIndexing = status?.status === 'pending' || status?.status === 'indexing' || isLoading;
  const isReady = status?.status === 'ready';
  const hasError = status?.status === 'error' || Boolean(error);

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <span>Repository Indexer</span>
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              RAG Engine
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Enter any public GitHub repository to clone, chunk, embed, and prepare for semantic code search.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </div>
            <input
              id="repo-url-input"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://github.com/facebook/react"
              disabled={isIndexing}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-zinc-100 placeholder-zinc-500 rounded-xl text-sm font-mono transition-all outline-none disabled:opacity-60"
              aria-label="GitHub repository URL"
              required
            />
          </div>

          <button
            id="repo-submit-btn"
            type="submit"
            disabled={isIndexing || !url.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 text-white text-sm font-semibold rounded-xl shadow-md transition-all duration-150 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            {isIndexing ? (
              <>
                <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Indexing…</span>
              </>
            ) : (
              <>
                <span>Index Repository</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>

        {/* Status Indicators */}
        {status && (
          <div className="pt-2">
            {status.status === 'pending' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Queued for indexing — waiting for worker…</span>
              </div>
            )}

            {status.status === 'indexing' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
                <svg className="animate-spin h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Processing &amp; embedding chunks: {status.fileCount} files · {status.chunkCount} chunks</span>
              </div>
            )}

            {isReady && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Ready for queries — Indexed {status.fileCount} files into {status.chunkCount} vector chunks</span>
              </div>
            )}

            {status.status === 'error' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                <span>✕</span>
                <span>Error: {status.errorMessage || 'Indexing failed'}</span>
              </div>
            )}
          </div>
        )}

        {error && !status?.errorMessage && hasError && (
          <div className="px-3.5 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
