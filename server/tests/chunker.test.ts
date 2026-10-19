import { describe, it, expect } from 'vitest';
import { chunkFile } from '../src/services/chunker';

// ── TypeScript / JavaScript chunking ──────────────────────────────────────────

const TS_WITH_FUNCTIONS = `
import { something } from 'somewhere';

function firstFunction(a: string): string {
  return a.toUpperCase();
}

export function secondFunction(b: number): number {
  return b * 2;
}

const thirdFunction = (c: boolean): boolean => {
  return !c;
};
`;

const TS_NO_FUNCTIONS = `
const x = 1;
const y = 2;
const z = x + y;
export { x, y, z };
`;

// ── Python chunking ───────────────────────────────────────────────────────────

const PY_WITH_CLASSES = `
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        raise NotImplementedError

class Dog(Animal):
    def speak(self):
        return "Woof!"

def standalone_function(x):
    return x * 2
`;

// ── Empty file ────────────────────────────────────────────────────────────────

describe('chunkFile — TypeScript', () => {
  it('produces multiple chunks for a file with 3 function-like declarations', () => {
    const chunks = chunkFile(TS_WITH_FUNCTIONS, 'src/utils.ts');
    expect(chunks.length).toBeGreaterThanOrEqual(3);
  });

  it('each chunk has correct metadata fields', () => {
    const chunks = chunkFile(TS_WITH_FUNCTIONS, 'src/utils.ts');
    for (const chunk of chunks) {
      expect(chunk.filePath).toBe('src/utils.ts');
      expect(chunk.startLine).toBeGreaterThan(0);
      expect(chunk.endLine).toBeGreaterThanOrEqual(chunk.startLine);
      expect(chunk.language).toBe('typescript');
      expect(chunk.content.length).toBeGreaterThan(0);
      expect(chunk.hash).toHaveLength(64); // SHA-256 hex
    }
  });

  it('uses sliding window fallback for a file with no detectable functions', () => {
    // Create a 150-line file with no function boundaries
    const content = Array.from({ length: 150 }, (_, i) => `const var${i} = ${i};`).join('\n');
    const chunks = chunkFile(content, 'src/constants.ts');
    expect(chunks.length).toBeGreaterThan(1);
    // Sliding window chunks — no boundary detection
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeGreaterThan(0);
    }
  });

  it('returns 0 chunks for an empty file', () => {
    expect(chunkFile('', 'src/empty.ts')).toHaveLength(0);
    expect(chunkFile('   ', 'src/whitespace.ts')).toHaveLength(0);
  });

  it('hashes are unique per chunk', () => {
    const chunks = chunkFile(TS_WITH_FUNCTIONS, 'src/utils.ts');
    const hashes = chunks.map(c => c.hash);
    const uniqueHashes = new Set(hashes);
    expect(uniqueHashes.size).toBe(hashes.length);
  });
});

describe('chunkFile — Python', () => {
  it('detects class and function boundaries', () => {
    const chunks = chunkFile(PY_WITH_CLASSES, 'app/animals.py');
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });

  it('assigns python language', () => {
    const chunks = chunkFile(PY_WITH_CLASSES, 'app/animals.py');
    for (const chunk of chunks) {
      expect(chunk.language).toBe('python');
    }
  });
});

describe('chunkFile — oversized chunk splitting', () => {
  it('splits a single large function into multiple chunks', () => {
    // Create a 200-line "function" that should be split
    const lines = ['function hugeFunction() {', ...Array.from({ length: 198 }, (_, i) => `  const x${i} = ${i};`), '}'];
    const content = lines.join('\n');
    const chunks = chunkFile(content, 'src/huge.ts');
    // Should have been split since it exceeds 120 lines
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });
});

describe('chunkFile — line number accuracy', () => {
  it('line numbers are 1-indexed and within file bounds', () => {
    const chunks = chunkFile(TS_WITH_FUNCTIONS, 'src/utils.ts');
    const totalLines = TS_WITH_FUNCTIONS.split('\n').length;
    for (const chunk of chunks) {
      expect(chunk.startLine).toBeGreaterThanOrEqual(1);
      expect(chunk.endLine).toBeLessThanOrEqual(totalLines);
    }
  });
});
