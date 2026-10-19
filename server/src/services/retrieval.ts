import { Types } from 'mongoose';
import { Chunk } from '../models/Chunk';
import { embedText } from './embedder';
import { logger } from '../utils/logger';

const TOP_K = 5;

export interface RetrievedChunk {
  filePath: string;
  startLine: number;
  endLine: number;
  language: string;
  content: string;
  score: number;
}

/**
 * Embeds the user's question and runs a vector search against Atlas.
 * Always filters by repoId to prevent cross-repo data leakage.
 *
 * NOTE: The Atlas vector search index must be created manually in the Atlas UI
 * with the following configuration:
 *   - Field: "embedding"
 *   - Similarity: cosine
 *   - Dimensions: 768
 *   - Index name: "embedding_index"
 */
export async function retrieveRelevantChunks(
  repoId: Types.ObjectId,
  question: string,
  topK: number = TOP_K
): Promise<RetrievedChunk[]> {
  if (!question.trim()) {
    throw new Error('Question cannot be empty');
  }

  const queryEmbedding = await embedText(question);

  logger.info('Running vector search', { repoId: repoId.toString(), topK });

  // Atlas $vectorSearch aggregation stage
  // Requires the "embedding_index" vector search index to exist on the chunks collection
  const results = await Chunk.aggregate([
    {
      $vectorSearch: {
        index: 'embedding_index',
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: topK * 10,
        limit: topK,
        filter: { repoId: repoId },   // ← always filter by repoId
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

  return results as RetrievedChunk[];
}
