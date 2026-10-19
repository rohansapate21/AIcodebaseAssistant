import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { validateRepoUrl } from '../utils/github';
import { Repo } from '../models/Repo';
import { Chunk } from '../models/Chunk';
import { deleteRepoChunks } from '../services/store';
import { ingestRepo } from '../services/ingestion';
import { generateRepoArchitectureSummary } from '../services/generation';
import { logger } from '../utils/logger';

const router = Router();

// Rate limit: 5 requests per minute per IP on repo submission
const repoRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many indexing requests. Please wait before submitting another repository.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── GET /api/repos — list recently indexed repositories ───────────────────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    const repos = await Repo.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('owner repo status fileCount chunkCount updatedAt createdAt');
    res.json(repos);
  } catch (err: unknown) {
    logger.error('Failed to list repos', { err });
    res.status(500).json({ error: 'Failed to retrieve repositories' });
  }
});

// ── POST /api/repos — submit a repo for indexing ──────────────────────────────
router.post('/', repoRateLimiter, async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Request body must include a "url" string field.' });
    return;
  }

  let owner: string;
  let repo: string;
  try {
    ({ owner, repo } = validateRepoUrl(url));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid URL';
    res.status(400).json({ error: message });
    return;
  }

  // Upsert repo document (allows re-indexing the same repo)
  let repoDoc;
  try {
    repoDoc = await Repo.findOneAndUpdate(
      { owner, repo },
      { $set: { status: 'pending', fileCount: 0, chunkCount: 0, errorMessage: undefined } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err: unknown) {
    logger.error('Failed to create repo document', { err });
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  // Respond immediately and run ingestion in the background
  res.status(202).json({
    repoId: repoDoc._id,
    owner,
    repo,
    status: 'pending',
  });

  // Fire and forget — ingestion updates status asynchronously
  ingestRepo(repoDoc._id).catch(err => {
    logger.error('Background ingestion threw uncaught error', { err });
  });
});

// ── GET /api/repos/:repoId — get indexing status ─────────────────────────────
router.get('/:repoId', async (req: Request, res: Response) => {
  const { repoId } = req.params;

  try {
    const repoDoc = await Repo.findById(repoId).select(
      'owner repo sha status fileCount chunkCount errorMessage architectureSummary createdAt updatedAt'
    );

    if (!repoDoc) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    res.json(repoDoc);
  } catch {
    res.status(400).json({ error: 'Invalid repo ID' });
  }
});

// ── GET /api/repos/:repoId/summary — get or generate architecture summary ─────
router.get('/:repoId/summary', async (req: Request, res: Response) => {
  const { repoId } = req.params;

  try {
    const repoDoc = await Repo.findById(repoId);
    if (!repoDoc) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    if (repoDoc.architectureSummary) {
      res.json(repoDoc.architectureSummary);
      return;
    }

    // Generate on demand if ready but missing summary
    if (repoDoc.status === 'ready') {
      const filePaths: string[] = await Chunk.distinct('filePath', { repoId: repoDoc._id });
      const summary = await generateRepoArchitectureSummary(repoDoc.owner, repoDoc.repo, filePaths);
      repoDoc.architectureSummary = summary;
      await repoDoc.save();
      res.json(summary);
      return;
    }

    res.status(409).json({ error: 'Repository is still indexing. Summary not ready.' });
  } catch (err) {
    logger.error('Failed to fetch summary', { repoId, err });
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// ── DELETE /api/repos/:repoId — delete repo and its chunks ───────────────────
router.delete('/:repoId', async (req: Request, res: Response) => {
  const { repoId } = req.params;

  try {
    const repoDoc = await Repo.findById(repoId);
    if (!repoDoc) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    const deletedChunks = await deleteRepoChunks(repoDoc._id);
    await Repo.findByIdAndDelete(repoId);

    logger.info('Repo deleted', { repoId, deletedChunks });
    res.json({ message: 'Repository and all associated chunks deleted', deletedChunks });
  } catch {
    res.status(400).json({ error: 'Invalid repo ID' });
  }
});

export default router;
