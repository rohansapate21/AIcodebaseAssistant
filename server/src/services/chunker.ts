import { createHash } from 'crypto';
import { detectLanguage } from '../utils/filter';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Chunk {
  filePath: string;
  startLine: number;   // 1-indexed
  endLine: number;     // 1-indexed, inclusive
  language: string;
  content: string;
  hash: string;        // SHA-256 of (filePath + startLine + content)
}

interface Boundary {
  start: number;       // 0-indexed line index
  end: number;         // 0-indexed, exclusive
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SLIDING_WINDOW_SIZE = 60;
const SLIDING_WINDOW_OVERLAP = 15;
const MAX_CHUNK_LINES = 120;

// ── Language-specific boundary regexes ───────────────────────────────────────
// Ordered by specificity — more specific patterns first.

const BOUNDARY_PATTERNS: RegExp[] = [
  // TypeScript / JavaScript
  /^\s*(export\s+)?(async\s+)?function\s+\w+/,
  /^\s*(export\s+)?(default\s+)?class\s+\w+/,
  /^\s*(export\s+)?const\s+\w+\s*=\s*(async\s+)?\(/,
  /^\s*(export\s+)?const\s+\w+\s*=\s*(async\s+)?function/,
  /^\s*(?:public|private|protected|static|async).*\w+\s*\(/,
  // Python
  /^\s*def\s+\w+\s*\(/,
  /^\s*class\s+\w+/,
  /^\s*async\s+def\s+\w+\s*\(/,
  // Go
  /^\s*func\s+(\(\w+\s+\*?\w+\)\s+)?\w+\s*\(/,
  // Rust
  /^\s*(pub\s+)?(async\s+)?fn\s+\w+/,
  /^\s*(pub\s+)?struct\s+\w+/,
  /^\s*(pub\s+)?impl\s+\w+/,
  // Java / Kotlin / C#
  /^\s*(public|private|protected|static|abstract|override)\s+[\w<>\[\]]+\s+\w+\s*\(/,
  /^\s*(public|private|protected)?\s*(class|interface|enum)\s+\w+/,
  // Ruby
  /^\s*(def|class|module)\s+\w+/,
  // PHP
  /^\s*(public|private|protected|static)?\s*function\s+\w+/,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeHash(filePath: string, startLine: number, content: string): string {
  return createHash('sha256')
    .update(`${filePath}:${startLine}:${content}`)
    .digest('hex');
}

function makeChunk(
  lines: string[],
  start: number,
  end: number,
  filePath: string,
  language: string
): Chunk {
  const content = lines.slice(start, end).join('\n');
  return {
    filePath,
    startLine: start + 1,
    endLine: end,
    language,
    content,
    hash: computeHash(filePath, start + 1, content),
  };
}

/**
 * Splits a chunk that exceeds MAX_CHUNK_LINES into two halves.
 */
function splitOversized(chunk: Chunk, lines: string[], language: string): Chunk[] {
  const chunkLines = lines.slice(chunk.startLine - 1, chunk.endLine);
  if (chunkLines.length <= MAX_CHUNK_LINES) return [chunk];

  const mid = chunk.startLine - 1 + Math.floor(chunkLines.length / 2);
  return [
    makeChunk(lines, chunk.startLine - 1, mid, chunk.filePath, language),
    makeChunk(lines, mid, chunk.endLine, chunk.filePath, language),
  ];
}

/**
 * Sliding window fallback — used when no boundary patterns are detected.
 */
function slidingWindow(lines: string[], filePath: string, language: string): Chunk[] {
  const chunks: Chunk[] = [];
  let start = 0;
  while (start < lines.length) {
    const end = Math.min(start + SLIDING_WINDOW_SIZE, lines.length);
    chunks.push(makeChunk(lines, start, end, filePath, language));
    if (end === lines.length) break;
    start += SLIDING_WINDOW_SIZE - SLIDING_WINDOW_OVERLAP;
  }
  return chunks;
}

/**
 * Detects function/class boundaries using regex patterns.
 * Returns an array of { start, end } (0-indexed line ranges).
 */
function detectBoundaries(lines: string[]): Boundary[] {
  const starts: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    for (const pattern of BOUNDARY_PATTERNS) {
      if (pattern.test(lines[i])) {
        starts.push(i);
        break;
      }
    }
  }

  if (starts.length === 0) return [];

  const boundaries: Boundary[] = [];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    // End is the line before the next boundary, or the last line
    const end = i + 1 < starts.length ? starts[i + 1] : lines.length;
    boundaries.push({ start, end });
  }
  return boundaries;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Splits a source file into semantic chunks.
 * Tries boundary detection first; falls back to sliding window if none found.
 * Chunks exceeding MAX_CHUNK_LINES are split at their midpoint.
 */
export function chunkFile(content: string, filePath: string): Chunk[] {
  if (!content || content.trim().length === 0) return [];

  const lines = content.split('\n');
  const language = detectLanguage(filePath);
  const boundaries = detectBoundaries(lines);

  let chunks: Chunk[];
  if (boundaries.length === 0) {
    chunks = slidingWindow(lines, filePath, language);
  } else {
    chunks = boundaries.map(b => makeChunk(lines, b.start, b.end, filePath, language));
  }

  // Split any oversized chunks
  return chunks.flatMap(chunk => splitOversized(chunk, lines, language));
}
