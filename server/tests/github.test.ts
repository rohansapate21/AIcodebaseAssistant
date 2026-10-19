import { describe, it, expect } from 'vitest';
import { validateRepoUrl } from '../src/utils/github';

describe('validateRepoUrl', () => {
  it('parses a standard GitHub URL', () => {
    const result = validateRepoUrl('https://github.com/expressjs/express');
    expect(result).toEqual({ owner: 'expressjs', repo: 'express' });
  });

  it('parses a URL with trailing slash', () => {
    const result = validateRepoUrl('https://github.com/facebook/react/');
    expect(result).toEqual({ owner: 'facebook', repo: 'react' });
  });

  it('parses a .git URL', () => {
    const result = validateRepoUrl('https://github.com/sindresorhus/got.git');
    expect(result).toEqual({ owner: 'sindresorhus', repo: 'got' });
  });

  it('parses a URL with extra path segments (uses first two)', () => {
    const result = validateRepoUrl('https://github.com/owner/repo/tree/main');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('throws on a non-GitHub URL', () => {
    expect(() => validateRepoUrl('https://gitlab.com/owner/repo')).toThrow('Not a GitHub URL');
  });

  it('throws on a malformed URL', () => {
    expect(() => validateRepoUrl('not-a-url')).toThrow('Invalid URL');
  });

  it('throws on a GitHub URL without repo', () => {
    expect(() => validateRepoUrl('https://github.com/onlyowner')).toThrow('owner and repo');
  });

  it('throws on an empty string', () => {
    expect(() => validateRepoUrl('')).toThrow();
  });
});
