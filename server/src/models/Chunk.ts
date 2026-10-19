import mongoose, { Schema, Document, Types } from 'mongoose';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IChunk extends Document {
  repoId: Types.ObjectId;
  filePath: string;
  startLine: number;
  endLine: number;
  language: string;
  content: string;
  hash: string;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const ChunkSchema = new Schema<IChunk>(
  {
    repoId: { type: Schema.Types.ObjectId, ref: 'Repo', required: true, index: true },
    filePath: { type: String, required: true },
    startLine: { type: Number, required: true },
    endLine: { type: Number, required: true },
    language: { type: String, required: true },
    content: { type: String, required: true },
    hash: { type: String, required: true, unique: true },
    // embedding stored as array of floats (768 dims for text-embedding-004)
    // The Atlas Vector Search index is created manually in the Atlas UI
    embedding: { type: [Number], default: [] },
  },
  {
    timestamps: true,
  }
);

// Unique index on hash and index on repoId are declared directly in field definitions above

// ── Model ─────────────────────────────────────────────────────────────────────

export const Chunk = mongoose.model<IChunk>('Chunk', ChunkSchema);
