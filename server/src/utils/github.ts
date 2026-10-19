import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RepoMeta {
  owner: string;
  repo: string;
  defaultBranch: string;
  sha: string;        // HEAD commit SHA
  size: number;       // kilobytes, as reported by GitHub
  description: string | null;
}

export interface TreeFile {
  path: string;
  sha: string;
  size: number;       // bytes
  url: string;
}

// ── GitHub client ─────────────────────────────────────────────────────────────

function createGitHubClient(): AxiosInstance {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return axios.create({
    baseURL: 'https://api.github.com',
    headers,
    timeout: 30_000,
  });
}

const gh = createGitHubClient();

// ── Rate limit guard ──────────────────────────────────────────────────────────

function checkRateLimit(headers: Record<string, string | undefined>): void {
  const remaining = parseInt(headers['x-ratelimit-remaining'] ?? '100', 10);
  if (remaining < 10) {
    logger.warn('GitHub rate limit low', { remaining });
  }
}

// ── Exponential backoff retry ─────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) throw err; // don't retry 404
      if (attempt < maxAttempts) {
        const delay = 1000 * 2 ** (attempt - 1); // 1s, 2s, 4s
        logger.warn('GitHub API retry', { attempt, delay, status });
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Validates and parses a GitHub repo URL.
 * Returns { owner, repo } or throws on invalid input.
 */
export function validateRepoUrl(url: string): { owner: string; repo: string } {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    throw new Error(`Invalid URL: "${url}"`);
  }

  if (parsed.hostname !== 'github.com') {
    throw new Error(`Not a GitHub URL: "${url}"`);
  }

  // pathname = /owner/repo  or /owner/repo/ or /owner/repo.git
  const parts = parsed.pathname.replace(/\.git$/, '').split('/').filter(Boolean);
  if (parts.length < 2) {
    throw new Error(`GitHub URL must include owner and repo: "${url}"`);
  }

  return { owner: parts[0], repo: parts[1] };
}

/**
 * Fetches repo metadata and validates size constraints.
 * Throws if repo is not found, is private, or exceeds 50 MB.
 */
export async function fetchRepoMeta(owner: string, repo: string): Promise<RepoMeta> {
  return withRetry(async () => {
    const res = await gh.get(`/repos/${owner}/${repo}`);
    checkRateLimit(res.headers as Record<string, string | undefined>);

    const data = res.data as {
      size: number;
      default_branch: string;
      description: string | null;
    };

    if (data.size > 50_000) {
      throw new Error(`Repository is too large (${data.size} KB). Maximum is 50,000 KB.`);
    }

    // Get default branch HEAD SHA
    const branchRes = await gh.get(`/repos/${owner}/${repo}/git/ref/heads/${data.default_branch}`);
    const sha = (branchRes.data as { object: { sha: string } }).object.sha;

    return {
      owner,
      repo,
      defaultBranch: data.default_branch,
      sha,
      size: data.size,
      description: data.description,
    };
  });
}

/**
 * Fetches the full recursive file tree for a given commit SHA.
 * Falls back to an empty array if the tree is truncated (>100,000 entries).
 */
export async function fetchFileTree(owner: string, repo: string, sha: string): Promise<TreeFile[]> {
  return withRetry(async () => {
    const res = await gh.get(`/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`);
    checkRateLimit(res.headers as Record<string, string | undefined>);

    const data = res.data as {
      tree: Array<{ type: string; path: string; sha: string; size?: number; url: string }>;
      truncated: boolean;
    };

    if (data.truncated) {
      logger.warn('File tree truncated — repo has >100,000 entries, some files may be missed');
    }

    return data.tree
      .filter(node => node.type === 'blob')
      .map(node => ({
        path: node.path,
        sha: node.sha,
        size: node.size ?? 0,
        url: node.url,
      }));
  });
}

/**
 * Fetches and decodes the raw content of a single file.
 * Returns null if the file cannot be decoded (binary, encoding error, etc.).
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  filePath: string
): Promise<string | null> {
  return withRetry(async () => {
    const res = await gh.get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`);
    checkRateLimit(res.headers as Record<string, string | undefined>);

    const data = res.data as { content?: string; encoding?: string };
    if (!data.content || data.encoding !== 'base64') {
      return null;
    }

    try {
      return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
    } catch {
      logger.warn('Failed to decode file content', { filePath });
      return null;
    }
  });
}
