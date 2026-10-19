import mongoose, { Schema, Document, Types } from 'mongoose';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RepoStatus = 'pending' | 'indexing' | 'ready' | 'error';

export interface RepoArchitectureSummary {
  overview: string;
  techStack: string[];
  keyModules: { name: string; path: string; purpose: string }[];
  suggestedQueries: string[];
}

export interface IRepo extends Document {
  owner: string;
  repo: string;
  sha: string;
  status: RepoStatus;
  fileCount: number;
  chunkCount: number;
  errorMessage?: string;
  architectureSummary?: RepoArchitectureSummary;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const RepoSchema = new Schema<IRepo>(
  {
    owner: { type: String, required: true, trim: true },
    repo: { type: String, required: true, trim: true },
    sha: { type: String, required: false, default: '' },
    status: {
      type: String,
      enum: ['pending', 'indexing', 'ready', 'error'],
      default: 'pending',
      required: true,
    },
    fileCount: { type: Number, default: 0 },
    chunkCount: { type: Number, default: 0 },
    errorMessage: { type: String },
    architectureSummary: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Unique index — one document per owner/repo combination
RepoSchema.index({ owner: 1, repo: 1 }, { unique: true });

// ── Model ─────────────────────────────────────────────────────────────────────

export const Repo = mongoose.model<IRepo>('Repo', RepoSchema);
