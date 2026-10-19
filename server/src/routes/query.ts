import { Router, Request, Response } from 'express';
import { generateAnswer, ConversationTurn } from '../services/generation';
import { Repo } from '../models/Repo';
import { ChatSession } from '../models/ChatSession';
import { Types } from 'mongoose';
import { logger } from '../utils/logger';

const router = Router();

// ── POST /api/repos/:repoId/query — ask a question with multi-turn memory ──────
router.post('/:repoId/query', async (req: Request, res: Response) => {
  const repoId = req.params.repoId as string;
  const { question, sessionId } = req.body as { question?: string; sessionId?: string };

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    res.status(400).json({ error: 'Request body must include a non-empty "question" string field.' });
    return;
  }

  if (!repoId || !Types.ObjectId.isValid(repoId)) {
    res.status(400).json({ error: 'Invalid repo ID' });
    return;
  }

  const repoObjectId = new Types.ObjectId(repoId);

  // Verify repo exists and is ready
  const repoDoc = await Repo.findById(repoObjectId);
  if (!repoDoc) {
    res.status(404).json({ error: 'Repository not found' });
    return;
  }
  if (repoDoc.status !== 'ready') {
    res.status(409).json({
      error: `Repository is not ready for queries. Current status: "${repoDoc.status}". Please wait for indexing to complete.`,
      status: repoDoc.status,
    });
    return;
  }

  // Load or initialize chat session
  let sessionDoc = null;
  if (sessionId && Types.ObjectId.isValid(sessionId)) {
    sessionDoc = await ChatSession.findOne({ _id: new Types.ObjectId(sessionId), repoId: repoObjectId });
  }

  if (!sessionDoc) {
    sessionDoc = new ChatSession({
      repoId: repoObjectId,
      messages: [],
    });
  }

  // Build prior conversation turns for context
  const history: ConversationTurn[] = sessionDoc.messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  try {
    logger.info('Processing query', { repoId, sessionId: sessionDoc._id.toString(), question: question.slice(0, 80) });
    const result = await generateAnswer(repoObjectId, question, history);

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `asst-${Date.now()}`;

    // Append user & assistant turns to session
    sessionDoc.messages.push(
      {
        id: userMsgId,
        role: 'user',
        content: question,
        timestamp: new Date(),
      },
      {
        id: assistantMsgId,
        role: 'assistant',
        content: result.answer,
        citations: result.citations,
        timestamp: new Date(),
      }
    );

    await sessionDoc.save();

    res.json({
      answer: result.answer,
      citations: result.citations,
      sessionId: sessionDoc._id.toString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = (err as { status?: number })?.status;

    if (status === 429) {
      res.status(503).json({ error: 'AI service temporarily unavailable due to quota limits. Please try again shortly.' });
    } else {
      logger.error('Query generation failed', { repoId, message });
      res.status(500).json({ error: 'Failed to generate answer' });
    }
  }
});

// ── GET /api/repos/:repoId/sessions/:sessionId — get session history ──────────
router.get('/:repoId/sessions/:sessionId', async (req: Request, res: Response) => {
  const { repoId, sessionId } = req.params;

  if (!Types.ObjectId.isValid(repoId) || !Types.ObjectId.isValid(sessionId)) {
    res.status(400).json({ error: 'Invalid repoId or sessionId' });
    return;
  }

  try {
    const sessionDoc = await ChatSession.findOne({
      _id: new Types.ObjectId(sessionId),
      repoId: new Types.ObjectId(repoId),
    });

    if (!sessionDoc) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({
      sessionId: sessionDoc._id.toString(),
      repoId: sessionDoc.repoId.toString(),
      messages: sessionDoc.messages,
      updatedAt: sessionDoc.updatedAt,
    });
  } catch (err: unknown) {
    logger.error('Failed to retrieve chat session', { repoId, sessionId, err });
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

export default router;
