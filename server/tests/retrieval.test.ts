import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { retrieveRelevantChunks } from '../src/services/retrieval';
import { Chunk } from '../src/models/Chunk';
import * as embedder from '../src/services/embedder';

vi.mock('../src/models/Chunk');
vi.mock('../src/services/embedder');

describe('retrieval service', () => {
  const dummyRepoId = new Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws an error if question is empty or whitespace', async () => {
    await expect(retrieveRelevantChunks(dummyRepoId, '')).rejects.toThrow('Question cannot be empty');
    await expect(retrieveRelevantChunks(dummyRepoId, '   ')).rejects.toThrow('Question cannot be empty');
  });

  it('embeds question and runs $vectorSearch aggregation with repoId filter', async () => {
    const dummyVector = [0.1, 0.2, 0.3];
    vi.mocked(embedder.embedText).mockResolvedValue(dummyVector);

    const mockSearchResults = [
      {
        filePath: 'src/auth.ts',
        startLine: 10,
        endLine: 25,
        language: 'typescript',
        content: 'function authenticate() {}',
        score: 0.89,
      },
    ];

    vi.mocked(Chunk.aggregate).mockResolvedValue(mockSearchResults as any);

    const results = await retrieveRelevantChunks(dummyRepoId, 'How does authentication work?', 3);

    expect(embedder.embedText).toHaveBeenCalledWith('How does authentication work?');
    expect(Chunk.aggregate).toHaveBeenCalledWith([
      {
        $vectorSearch: {
          index: 'embedding_index',
          path: 'embedding',
          queryVector: dummyVector,
          numCandidates: 30,
          limit: 3,
          filter: { repoId: dummyRepoId },
        },
      },
      {
        $project: {
          filePath: 1,
          startLine: 1,
          endLine: 1,
          language: 1,
          content: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    expect(results).toEqual(mockSearchResults);
  });
});
