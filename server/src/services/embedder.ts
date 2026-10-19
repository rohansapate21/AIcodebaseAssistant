import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { Chunk as ChunkData } from './chunker';
import { updateChunkEmbedding } from './store';
import { logger } from '../utils/logger';

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSION = 768;
const BATCH_SIZE = 100;
const MAX_RETRIES = 3;

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Generates an embedding for a single text string.
 * Used for embedding query strings at search time.
 */
export async function embedText(text: string): Promise<number[]> {
  const model = getGenAI().getGenerativeModel({ model: EMBEDDING_MODEL });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.embedContent({
        content: { parts: [{ text }] },
        taskType: TaskType.RETRIEVAL_QUERY,
        outputDimensionality: EMBEDDING_DIMENSION,
      } as any);
      return result.embedding.values;
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 429 && attempt < MAX_RETRIES) {
        const delay = 1000 * 2 ** attempt;
        logger.warn('Gemini embedding quota hit, retrying', { attempt, delay });
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Embedding failed after maximum retries');
}

/**
 * Generates embeddings for a batch of chunks and persists them to MongoDB.
 * Processes chunks in batches of BATCH_SIZE with exponential backoff on 429.
 */
export async function embedAndStoreChunks(chunks: ChunkData[]): Promise<void> {
  const model = getGenAI().getGenerativeModel({ model: EMBEDDING_MODEL });

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    logger.info('Embedding batch', { from: i, to: i + batch.length, total: chunks.length });

    for (const chunk of batch) {
      let lastError: unknown;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await model.embedContent({
            content: { parts: [{ text: chunk.content }] },
            taskType: TaskType.RETRIEVAL_DOCUMENT,
            outputDimensionality: EMBEDDING_DIMENSION,
          } as any);
          await updateChunkEmbedding(chunk.hash, result.embedding.values);
          break; // success
        } catch (err: unknown) {
          lastError = err;
          const status = (err as { status?: number })?.status;
          if (status === 429 && attempt < MAX_RETRIES) {
            const delay = 1000 * 2 ** attempt;
            logger.warn('Gemini 429, backing off', { attempt, delay, filePath: chunk.filePath });
            await new Promise(r => setTimeout(r, delay));
          } else if (attempt === MAX_RETRIES) {
            logger.error('Embedding failed after retries', { filePath: chunk.filePath });
            throw lastError;
          }
        }
      }
    }
  }
}
