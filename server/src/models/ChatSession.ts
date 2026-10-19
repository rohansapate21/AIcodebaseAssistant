import mongoose, { Schema, Document, Types } from 'mongoose';
import { Citation } from '../services/generation';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

export interface IChatSession extends Document {
  repoId: Types.ObjectId;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatSessionSchema = new Schema<IChatSession>(
  {
    repoId: { type: Schema.Types.ObjectId, ref: 'Repo', required: true, index: true },
    messages: [
      {
        id: { type: String, required: true },
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        citations: { type: Array, default: [] },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const ChatSession = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
