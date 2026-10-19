import axios from 'axios';
import type {
  RepoSubmitResponse,
  RepoStatusResponse,
  QueryResponse,
  RepoArchitectureSummary,
  Message,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// ── Repo API ──────────────────────────────────────────────────────────────────

export async function submitRepo(url: string): Promise<RepoSubmitResponse> {
  const res = await api.post<RepoSubmitResponse>('/api/repos', { url });
  return res.data;
}

export async function getRepoStatus(repoId: string): Promise<RepoStatusResponse> {
  const res = await api.get<RepoStatusResponse>(`/api/repos/${repoId}`);
  return res.data;
}

export async function getRepoSummary(repoId: string): Promise<RepoArchitectureSummary> {
  const res = await api.get<RepoArchitectureSummary>(`/api/repos/${repoId}/summary`);
  return res.data;
}

export async function deleteRepo(repoId: string): Promise<void> {
  await api.delete(`/api/repos/${repoId}`);
}

// ── Query API ─────────────────────────────────────────────────────────────────

export async function queryRepo(
  repoId: string,
  question: string,
  sessionId?: string
): Promise<QueryResponse> {
  const res = await api.post<QueryResponse>(`/api/repos/${repoId}/query`, { question, sessionId });
  return res.data;
}

export async function getSessionHistory(
  repoId: string,
  sessionId: string
): Promise<{ messages: Message[] }> {
  const res = await api.get<{ messages: Message[] }>(`/api/repos/${repoId}/sessions/${sessionId}`);
  return res.data;
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<{ status: string }> {
  const res = await api.get<{ status: string }>('/api/health');
  return res.data;
}
