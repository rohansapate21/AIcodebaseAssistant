import { describe, it, expect } from 'vitest';
import { shouldIndexFile, shouldIndexContent, isBinary, detectLanguage } from '../src/utils/filter';

describe('shouldIndexFile', () => {
  it('allows a .ts file of acceptable size', () => {
    expect(shouldIndexFile('src/utils/helper.ts', 50_000).allowed).toBe(true);
  });

  it('blocks a file in node_modules', () => {
    const result = shouldIndexFile('node_modules/lodash/index.js', 1000);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('skipped directory');
  });

  it('blocks a file in dist/', () => {
    expect(shouldIndexFile('dist/bundle.js', 1000).allowed).toBe(false);
  });

  it('blocks a nested node_modules path', () => {
    expect(shouldIndexFile('packages/core/node_modules/axios/index.js', 1000).allowed).toBe(false);
  });

  it('blocks a .min.js file', () => {
    expect(shouldIndexFile('public/jquery.min.js', 5000).allowed).toBe(false);
  });

  it('blocks a .map file', () => {
    expect(shouldIndexFile('dist/app.js.map', 2000).allowed).toBe(false);
  });

  it('blocks package-lock.json', () => {
    expect(shouldIndexFile('package-lock.json', 200_000).allowed).toBe(false);
  });

  it('blocks files larger than 100 KB', () => {
    const result = shouldIndexFile('src/bigfile.ts', 101 * 1024);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('too large');
  });

  it('blocks a disallowed extension', () => {
    expect(shouldIndexFile('image.png', 1000).allowed).toBe(false);
  });

  it('allows a .py file', () => {
    expect(shouldIndexFile('app/main.py', 20_000).allowed).toBe(true);
  });

  it('allows a .md file', () => {
    expect(shouldIndexFile('README.md', 5_000).allowed).toBe(true);
  });
});

describe('shouldIndexContent', () => {
  it('blocks binary content', () => {
    expect(shouldIndexContent('file.ts', 'hello\0world').allowed).toBe(false);
  });

  it('blocks empty files', () => {
    expect(shouldIndexContent('file.ts', '   \n  ').allowed).toBe(false);
  });

  it('allows normal source code', () => {
    expect(shouldIndexContent('file.ts', 'const x = 1;').allowed).toBe(true);
  });
});

describe('isBinary', () => {
  it('detects null byte', () => {
    expect(isBinary('hello\0world')).toBe(true);
  });

  it('returns false for text', () => {
    expect(isBinary('function hello() {}')).toBe(false);
  });
});

describe('detectLanguage', () => {
  it('detects TypeScript', () => expect(detectLanguage('foo.ts')).toBe('typescript'));
  it('detects JavaScript', () => expect(detectLanguage('foo.js')).toBe('javascript'));
  it('detects Python', () => expect(detectLanguage('foo.py')).toBe('python'));
  it('detects Go', () => expect(detectLanguage('foo.go')).toBe('go'));
  it('returns unknown for unrecognised extension', () => expect(detectLanguage('foo.xyz')).toBe('unknown'));
});
