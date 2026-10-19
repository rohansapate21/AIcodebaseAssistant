import React from 'react';
import { useRepo } from './hooks/useRepo';
import { useChat } from './hooks/useChat';
import { RepoInput } from './components/RepoInput';
import { RepoOverview } from './components/RepoOverview';
import { ChatWindow } from './components/ChatWindow';

const App: React.FC = () => {
  const { repoId, status, isLoading: repoLoading, error: repoError, submitRepoUrl } = useRepo();
  const { messages, isLoading: chatLoading, error: chatError, sendMessage } = useChat();

  const isReady = status?.status === 'ready';

  const handleSendMessage = (question: string) => {
    if (repoId) {
      sendMessage(repoId, question);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-zinc-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200 antialiased">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>AI Codebase Assistant</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  v1.0
                </span>
              </h1>
              <p className="text-[11px] text-zinc-400">Semantic RAG Q&amp;A for Public GitHub Repositories</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Gemini 3.8 Flash
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col gap-6">
        {/* Repo Input Section */}
        <section aria-label="Repository input">
          <RepoInput
            onSubmit={submitRepoUrl}
            isLoading={repoLoading}
            status={status}
            error={repoError}
          />
        </section>

        {/* Repository Intelligence Overview */}
        {isReady && status && status.architectureSummary && (
          <section aria-label="Repository Architecture Overview">
            <RepoOverview
              status={status}
              onSelectQuery={handleSendMessage}
            />
          </section>
        )}

        {/* Chat Section */}
        <section aria-label="Code Q&A chat" className="flex-1 flex flex-col">
          <ChatWindow
            messages={messages}
            isLoading={chatLoading}
            error={chatError}
            onSendMessage={handleSendMessage}
            disabled={!isReady}
            suggestedQueries={status?.architectureSummary?.suggestedQueries}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/60 py-4 text-center text-xs text-zinc-500">
        <p>Built with MongoDB Atlas Vector Search, Google Gemini API, React &amp; Express</p>
      </footer>
    </div>
  );
};

export default App;
