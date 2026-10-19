import path from 'path';

// ── Allowed source file extensions ────────────────────────────────────────────
const ALLOWED_EXTENSIONS = new Set([
  '.js', '.ts', '.jsx', '.tsx',   // JavaScript / TypeScript
  '.py',                           // Python
  '.java',                         // Java
  '.go',                           // Go
  '.rs',                           // Rust
  '.cpp', '.c', '.h', '.hpp',      // C / C++
  '.cs',                           // C#
  '.rb',                           // Ruby
  '.php',                          // PHP
  '.swift',                        // Swift
  '.kt', '.kts',                   // Kotlin
  '.md',                           // Markdown (documentation)
]);

// ── Directories to skip entirely ──────────────────────────────────────────────
const SKIP_DIRS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'vendor',
  '__pycache__',
  '.next',
  '.nuxt',
  'coverage',
  '.cache',
  'out',
  'target',        // Rust / Maven
  'bin', 'obj',    // .NET
  'venv', '.venv', // Python virtual envs
];

// ── File name / suffix patterns to skip ──────────────────────────────────────
const SKIP_SUFFIXES = ['.min.js', '.min.css', '.map', '.lock', '.sum', '.snap'];
const SKIP_FILENAMES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'Cargo.lock']);

const MAX_FILE_SIZE_BYTES = 100 * 1024; // 100 KB

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns true if the file path sits inside a directory that should be skipped.
 */
function isInSkippedDir(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  for (const dir of SKIP_DIRS) {
    if (
      normalized.startsWith(`${dir}/`) ||
      normalized.includes(`/${dir}/`)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true if the file name or extension should be skipped.
 */
function hasSkippedSuffix(filePath: string): boolean {
  const base = path.basename(filePath);
  if (SKIP_FILENAMES.has(base)) return true;
  for (const suffix of SKIP_SUFFIXES) {
    if (base.endsWith(suffix)) return true;
  }
  return false;
}

/**
 * Returns true if the file has an allowed source extension.
 */
function hasAllowedExtension(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

/**
 * Detects binary content via null-byte presence.
 */
export function isBinary(content: string): boolean {
  return content.includes('\0');
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface FilterResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Determines whether a file (by path and size) should be included in indexing.
 * This runs before fetching content (size-based check only).
 */
export function shouldIndexFile(filePath: string, sizeBytes: number): FilterResult {
  if (isInSkippedDir(filePath)) {
    return { allowed: false, reason: 'skipped directory' };
  }
  if (hasSkippedSuffix(filePath)) {
    return { allowed: false, reason: 'skipped file suffix' };
  }
  if (!hasAllowedExtension(filePath)) {
    return { allowed: false, reason: 'disallowed extension' };
  }
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return { allowed: false, reason: `file too large (${sizeBytes} bytes)` };
  }
  return { allowed: true };
}

/**
 * Content-level filter: run after fetching the raw file content.
 * Checks for binary data and encoding errors.
 */
export function shouldIndexContent(filePath: string, content: string): FilterResult {
  if (isBinary(content)) {
    return { allowed: false, reason: 'binary file' };
  }
  if (content.trim().length === 0) {
    return { allowed: false, reason: 'empty file' };
  }
  return { allowed: true };
}

/**
 * Maps a file extension to a human-readable language name.
 */
export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.js': 'javascript',   '.jsx': 'javascript',
    '.ts': 'typescript',   '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.cpp': 'cpp',         '.c': 'c',    '.h': 'c',    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',       '.kts': 'kotlin',
    '.md': 'markdown',
  };
  return map[ext] ?? 'unknown';
}
