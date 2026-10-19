import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  await mongoose.connect(uri);
  logger.info('Connected to MongoDB Atlas');
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB Atlas');
}
