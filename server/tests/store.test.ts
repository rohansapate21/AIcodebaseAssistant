import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { storeChunks, updateChunkEmbedding, updateRepoStats, deleteRepoChunks } from '../src/services/store';
import { Chunk } from '../src/models/Chunk';
import { Repo } from '../src/models/Repo';

vi.mock('../src/models/Chunk');
vi.mock('../src/models/Repo');

describe('store service', () => {
  const dummyRepoId = new Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('storeChunks', () => {
    it('stores chunks and returns inserted count', async () => {
      vi.mocked(Chunk.countDocuments).mockResolvedValue(0 as any);
      vi.mocked(Chunk.findOneAndUpdate).mockResolvedValue({} as any);

      const chunks = [
        {
          filePath: 'src/index.ts',
          startLine: 1,
          endLine: 10,
          language: 'typescript',
          content: 'console.log("hello");',
          hash: 'hash1',
          embedding: [0.1, 0.2],
        },
      ];

      const inserted = await storeChunks(dummyRepoId, chunks);
      expect(inserted).toBe(1);
      expect(Chunk.findOneAndUpdate).toHaveBeenCalledWith(
        { hash: 'hash1' },
        expect.objectContaining({
          $setOnInsert: expect.objectContaining({
            repoId: dummyRepoId,
            hash: 'hash1',
          }),
        }),
        { upsert: true, new: false }
      );
    });

    it('silently ignores duplicate key errors (code 11000)', async () => {
      vi.mocked(Chunk.countDocuments).mockResolvedValue(0 as any);
      const duplicateError = new Error('E11000 duplicate key');
      (duplicateError as any).code = 11000;
      vi.mocked(Chunk.findOneAndUpdate).mockRejectedValue(duplicateError);

      const chunks = [
        {
          filePath: 'src/index.ts',
          startLine: 1,
          endLine: 10,
          language: 'typescript',
          content: 'code',
          hash: 'existing-hash',
        },
      ];

      const inserted = await storeChunks(dummyRepoId, chunks);
      expect(inserted).toBe(0);
    });

    it('enforces maximum 5,000 chunks per repo limit', async () => {
      vi.mocked(Chunk.countDocuments).mockResolvedValue(5000 as any);

      const chunks = [
        {
          filePath: 'src/index.ts',
          startLine: 1,
          endLine: 10,
          language: 'typescript',
          content: 'code',
          hash: 'hash-overflow',
        },
      ];

      const inserted = await storeChunks(dummyRepoId, chunks);
      expect(inserted).toBe(0);
      expect(Chunk.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('updateChunkEmbedding', () => {
    it('updates chunk embedding by hash', async () => {
      vi.mocked(Chunk.updateOne).mockResolvedValue({} as any);

      await updateChunkEmbedding('hash123', [0.1, 0.2, 0.3]);
      expect(Chunk.updateOne).toHaveBeenCalledWith(
        { hash: 'hash123' },
        { $set: { embedding: [0.1, 0.2, 0.3] } }
      );
    });
  });

  describe('updateRepoStats', () => {
    it('updates repo document fields', async () => {
      vi.mocked(Repo.findByIdAndUpdate).mockResolvedValue({} as any);

      await updateRepoStats(dummyRepoId, { status: 'ready', chunkCount: 15 });
      expect(Repo.findByIdAndUpdate).toHaveBeenCalledWith(dummyRepoId, {
        $set: { status: 'ready', chunkCount: 15 },
      });
    });
  });

  describe('deleteRepoChunks', () => {
    it('deletes chunks by repoId and returns count', async () => {
      vi.mocked(Chunk.deleteMany).mockResolvedValue({ deletedCount: 8 } as any);

      const count = await deleteRepoChunks(dummyRepoId);
      expect(count).toBe(8);
      expect(Chunk.deleteMany).toHaveBeenCalledWith({ repoId: dummyRepoId });
    });
  });
});
