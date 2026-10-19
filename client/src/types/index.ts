// Shared TypeScript types between hooks, components, and API calls

export type RepoStatus = 'pending' | 'indexing' | 'ready' | 'error';

export interface RepoSubmitResponse {
  repoId: string;
  owner: string;
  repo: string;
  status: RepoStatus;
}

export interface KeyModule {
  name: string;
  path: string;
  purpose: string;
}

export interface RepoArchitectureSummary {
  overview: string;
  techStack: string[];
  keyModules: KeyModule[];
  suggestedQueries: string[];
}

export interface RepoStatusResponse {
  _id: string;
  owner: string;
  repo: string;
  sha: string;
  status: RepoStatus;
  fileCount: number;
  chunkCount: number;
  errorMessage?: string;
  architectureSummary?: RepoArchitectureSummary;
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  filePath: string;
  startLine: number;
  endLine: number;
  githubUrl: string;
  content?: string;
  language?: string;
}

export interface QueryResponse {
  answer: string;
  citations: Citation[];
  sessionId?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
}
