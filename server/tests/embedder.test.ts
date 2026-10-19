import { describe, it, expect, vi, beforeEach } from 'vitest';
import { embedText, embedAndStoreChunks } from '../src/services/embedder';
import * as store from '../src/services/store';

// Mock store
vi.mock('../src/services/store', () => ({
  updateChunkEmbedding: vi.fn().mockResolvedValue(undefined),
}));

// Mock GoogleGenerativeAI
const mockEmbedContent = vi.fn();
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      embedContent: mockEmbedContent,
    }),
  })),
  TaskType: {
    RETRIEVAL_QUERY: 'RETRIEVAL_QUERY',
    RETRIEVAL_DOCUMENT: 'RETRIEVAL_DOCUMENT',
  },
}));

describe('embedder service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  describe('embedText', () => {
    it('returns embedding vector from Gemini API', async () => {
      mockEmbedContent.mockResolvedValueOnce({
        embedding: { values: [0.12, 0.34, 0.56] },
      });

      const result = await embedText('test query');
      expect(result).toEqual([0.12, 0.34, 0.56]);
      expect(mockEmbedContent).toHaveBeenCalledWith(
        expect.objectContaining({
          content: { parts: [{ text: 'test query' }] },
          outputDimensionality: 768,
        })
      );
    });

    it('throws when GEMINI_API_KEY is missing', async () => {
      delete process.env.GEMINI_API_KEY;
    });
  });

  describe('embedAndStoreChunks', () => {
    it('generates embeddings for chunks and saves them via updateChunkEmbedding', async () => {
      mockEmbedContent.mockResolvedValue({
        embedding: { values: [0.99, 0.88] },
      });

      const chunks = [
        {
          filePath: 'src/main.ts',
          startLine: 1,
          endLine: 10,
          language: 'typescript',
          content: 'console.log("hello")',
          hash: 'chunk-hash-1',
        },
      ];

      await embedAndStoreChunks(chunks);

      expect(mockEmbedContent).toHaveBeenCalledWith(
        expect.objectContaining({
          content: { parts: [{ text: 'console.log("hello")' }] },
          outputDimensionality: 768,
        })
      );
      expect(store.updateChunkEmbedding).toHaveBeenCalledWith('chunk-hash-1', [0.99, 0.88]);
    });
  });
});
