import { useState, useCallback } from 'react';
import { queryRepo } from '../services/api';
import type { Message } from '../types';

interface UseChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
}

interface UseChatReturn extends UseChatState {
  sendMessage: (repoId: string, question: string) => Promise<void>;
  clearMessages: () => void;
  setSessionId: (id: string | null) => void;
}

let messageIdCounter = 0;
function nextId(): string {
  return `msg-${++messageIdCounter}`;
}

export function useChat(): UseChatReturn {
  const [state, setState] = useState<UseChatState>({
    messages: [],
    isLoading: false,
    error: null,
    sessionId: null,
  });

  const sendMessage = useCallback(async (repoId: string, question: string) => {
    if (!question.trim()) return;

    // Append user message immediately
    const userMessage: Message = {
      id: nextId(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    let currentSessionId: string | null = null;

    setState(prev => {
      currentSessionId = prev.sessionId;
      return {
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null,
      };
    });

    try {
      const response = await queryRepo(repoId, question, currentSessionId || undefined);

      const assistantMessage: Message = {
        id: nextId(),
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        sessionId: response.sessionId || prev.sessionId,
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to get an answer. Please try again.';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, []);

  const clearMessages = useCallback(() => {
    setState({ messages: [], isLoading: false, error: null, sessionId: null });
  }, []);

  const setSessionId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, sessionId: id }));
  }, []);

  return { ...state, sendMessage, clearMessages, setSessionId };
}
