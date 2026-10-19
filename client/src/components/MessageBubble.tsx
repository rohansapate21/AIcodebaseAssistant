import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '../types';
import { CitationCard } from './CitationCard';

interface Props {
  message: Message;
  onSelectCitation?: (citation: Citation) => void;
}

const CodeBlock: React.FC<{ language?: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-zinc-700/80 bg-[#1e1e24] shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-700/60 text-xs text-zinc-400 font-mono">
        <span className="uppercase tracking-wider font-semibold text-purple-400">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="text-xs px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '0.85rem 1rem',
          fontSize: '0.84rem',
          background: 'transparent',
          lineHeight: '1.5',
        }}
        wrapLongLines={true}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export const MessageBubble: React.FC<Props> = ({ message, onSelectCitation }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-2`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-md ${
          isUser
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs'
            : 'bg-zinc-900/95 border border-zinc-800 text-zinc-200 rounded-bl-xs'
        }`}
      >
        {/* Header: role + timestamp */}
        <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/10 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            {isUser ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>You</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-purple-300 font-semibold">AI Assistant</span>
              </>
            )}
          </div>
          <span className="text-zinc-400 text-[11px]">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Content */}
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-100">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed space-y-2">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !String(children).includes('\n');
                  if (isInline) {
                    return (
                      <code
                        className="bg-zinc-800/80 text-purple-300 px-1.5 py-0.5 rounded text-xs font-mono border border-zinc-700/50"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <CodeBlock
                      language={match ? match[1] : ''}
                      value={String(children).replace(/\n$/, '')}
                    />
                  );
                },
                p({ children }) {
                  return <p className="text-sm leading-relaxed mb-2 text-zinc-200">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-300 mb-2">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-5 space-y-1 text-sm text-zinc-300 mb-2">{children}</ol>;
                },
                li({ children }) {
                  return <li className="text-sm text-zinc-300">{children}</li>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Citations section */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <span>Verified Sources ({message.citations.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.citations.map(citation => (
                <CitationCard
                  key={`${citation.filePath}-${citation.startLine}`}
                  citation={citation}
                  onSelect={onSelectCitation}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
