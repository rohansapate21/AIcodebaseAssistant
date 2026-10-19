import { useState, useCallback, useRef } from 'react';
import { submitRepo, getRepoStatus } from '../services/api';
import type { RepoStatusResponse } from '../types';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 150; // 5 minutes max

interface UseRepoState {
  repoId: string | null;
  status: RepoStatusResponse | null;
  isLoading: boolean;
  error: string | null;
}

interface UseRepoReturn extends UseRepoState {
  submitRepoUrl: (url: string) => Promise<void>;
  reset: () => void;
}

export function useRepo(): UseRepoReturn {
  const [state, setState] = useState<UseRepoState>({
    repoId: null,
    status: null,
    isLoading: false,
    error: null,
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback((repoId: string) => {
    pollCountRef.current = 0;
    pollRef.current = setInterval(async () => {
      pollCountRef.current++;
      if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling();
        setState(prev => ({ ...prev, isLoading: false, error: 'Indexing timed out. Please try again.' }));
        return;
      }

      try {
        const status = await getRepoStatus(repoId);
        setState(prev => ({ ...prev, status }));

        if (status.status === 'ready' || status.status === 'error') {
          stopPolling();
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: status.status === 'error' ? (status.errorMessage ?? 'Indexing failed') : null,
          }));
        }
      } catch {
        // Network hiccup — continue polling
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  const submitRepoUrl = useCallback(async (url: string) => {
    stopPolling();
    setState({ repoId: null, status: null, isLoading: true, error: null });

    try {
      const response = await submitRepo(url);
      setState(prev => ({ ...prev, repoId: response.repoId }));
      startPolling(response.repoId);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to submit repository';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
    }
  }, [startPolling, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setState({ repoId: null, status: null, isLoading: false, error: null });
  }, [stopPolling]);

  return { ...state, submitRepoUrl, reset };
}
