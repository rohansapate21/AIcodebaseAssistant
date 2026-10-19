import { Types } from 'mongoose';
import { Chunk } from '../models/Chunk';
import { Repo, RepoArchitectureSummary } from '../models/Repo';
import { Chunk as ChunkData } from './chunker';
import { logger } from '../utils/logger';

const MAX_CHUNKS_PER_REPO = 5_000;

/**
 * Upserts an array of chunks into MongoDB.
 * Skips chunks whose hash already exists (idempotent re-indexing).
 * Returns the number of newly inserted chunks.
 */
export async function storeChunks(
  repoId: Types.ObjectId,
  chunks: (ChunkData & { embedding?: number[] })[]
): Promise<number> {
  let inserted = 0;

  // Check current chunk count for this repo
  const existingCount = await Chunk.countDocuments({ repoId });
  const remaining = MAX_CHUNKS_PER_REPO - existingCount;

  if (remaining <= 0) {
    logger.warn('Chunk limit reached for repo — skipping remaining chunks', {
      repoId: repoId.toString(),
    });
    return 0;
  }

  const toStore = chunks.slice(0, remaining);

  for (const chunk of toStore) {
    try {
      await Chunk.findOneAndUpdate(
        { hash: chunk.hash },
        {
          $setOnInsert: {
            repoId,
            filePath: chunk.filePath,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            language: chunk.language,
            content: chunk.content,
            hash: chunk.hash,
            embedding: chunk.embedding ?? [],
          },
        },
        { upsert: true, new: false }
      );
      inserted++;
    } catch (err: unknown) {
      // Duplicate key error (code 11000) = chunk already exists, skip silently
      if ((err as { code?: number }).code === 11000) {
        continue;
      }
      throw err;
    }
  }

  return inserted;
}

/**
 * Updates the embedding for an already-stored chunk (identified by hash).
 */
export async function updateChunkEmbedding(hash: string, embedding: number[]): Promise<void> {
  await Chunk.updateOne({ hash }, { $set: { embedding } });
}

import { Repo, RepoArchitectureSummary } from '../models/Repo';

/**
 * Updates the repo document's status, fileCount, chunkCount, and architectureSummary.
 */
export async function updateRepoStats(
  repoId: Types.ObjectId,
  update: Partial<{
    status: 'pending' | 'indexing' | 'ready' | 'error';
    fileCount: number;
    chunkCount: number;
    sha: string;
    errorMessage: string;
    architectureSummary: RepoArchitectureSummary;
  }>
): Promise<void> {
  await Repo.findByIdAndUpdate(repoId, { $set: update });
}

/**
 * Deletes all chunks associated with a repo.
 */
export async function deleteRepoChunks(repoId: Types.ObjectId): Promise<number> {
  const result = await Chunk.deleteMany({ repoId });
  return result.deletedCount;
}
