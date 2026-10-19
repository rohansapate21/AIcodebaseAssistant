import { Types } from 'mongoose';
import { Repo } from '../models/Repo';
import { validateRepoUrl, fetchRepoMeta, fetchFileTree, fetchFileContent } from '../utils/github';
import { shouldIndexFile, shouldIndexContent } from '../utils/filter';
import { chunkFile } from './chunker';
import { storeChunks, updateRepoStats } from './store';
import { embedAndStoreChunks } from './embedder';
import { generateRepoArchitectureSummary } from './generation';
import { logger } from '../utils/logger';

/**
 * Full ingestion pipeline:
 * GitHub fetch → filter → chunk → store → embed → update repo status
 *
 * Runs asynchronously after responding to the client.
 * Updates repo.status at each stage.
 */
export async function ingestRepo(repoId: Types.ObjectId): Promise<void> {
  try {
    const repoDoc = await Repo.findById(repoId);
    if (!repoDoc) throw new Error(`Repo ${repoId} not found`);

    await updateRepoStats(repoId, { status: 'indexing' });
    logger.info('Starting ingestion', { owner: repoDoc.owner, repo: repoDoc.repo });

    // 1. Fetch repo metadata
    const meta = await fetchRepoMeta(repoDoc.owner, repoDoc.repo);
    await updateRepoStats(repoId, { sha: meta.sha });

    // 2. Fetch file tree
    const tree = await fetchFileTree(repoDoc.owner, repoDoc.repo, meta.sha);

    // 3. Filter files by path and size
    const allowedFiles = tree.filter(file => {
      const result = shouldIndexFile(file.path, file.size);
      return result.allowed;
    });

    logger.info('Files after filter', { total: tree.length, allowed: allowedFiles.length });

    // 4. Fetch content, chunk, and store
    let totalChunks = 0;
    let processedFiles = 0;
    const allChunks: ReturnType<typeof chunkFile> = [];

    for (const file of allowedFiles) {
      const content = await fetchFileContent(repoDoc.owner, repoDoc.repo, file.path);
      if (!content) continue;

      const contentCheck = shouldIndexContent(file.path, content);
      if (!contentCheck.allowed) continue;

      const chunks = chunkFile(content, file.path);
      if (chunks.length === 0) continue;

      const inserted = await storeChunks(repoId, chunks);
      totalChunks += inserted;
      processedFiles++;
      allChunks.push(...chunks);

      logger.debug('File chunked', { path: file.path, chunks: chunks.length });
    }

    await updateRepoStats(repoId, { fileCount: processedFiles, chunkCount: totalChunks });

    // 5. Generate embeddings for all stored chunks
    logger.info('Generating embeddings', { chunkCount: allChunks.length });
    await embedAndStoreChunks(allChunks);

    // 6. Generate repository architecture summary
    let architectureSummary;
    try {
      logger.info('Generating repository architecture summary', { owner: repoDoc.owner, repo: repoDoc.repo });
      const sampleReadme = allChunks.find(c => c.filePath.toLowerCase().includes('readme'))?.content;
      architectureSummary = await generateRepoArchitectureSummary(
        repoDoc.owner,
        repoDoc.repo,
        allowedFiles.map(f => f.path),
        sampleReadme
      );
    } catch (summaryErr) {
      logger.warn('Failed to generate architecture summary, continuing', { summaryErr });
    }

    // 7. Mark as ready
    await updateRepoStats(repoId, {
      status: 'ready',
      chunkCount: totalChunks,
      ...(architectureSummary ? { architectureSummary } : {}),
    });
    logger.info('Ingestion complete', { repoId: repoId.toString(), totalChunks, processedFiles });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Ingestion failed', { repoId: repoId.toString(), message });
    await updateRepoStats(repoId, { status: 'error', errorMessage: message });
  }
}
