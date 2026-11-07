import mongoose from 'mongoose';
import { env } from './env';

// Cached promise: on serverless (Vercel) a new process starts per cold start,
// and the function may receive traffic before the first connection finishes.
let connection: Promise<typeof mongoose> | null = null;
let listenersAttached = false;

function attachListeners(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect on next request...');
    // Drop the cached promise so the next request retries the connection
    // instead of reusing one that is already dead.
    connection = null;
  });
}

/**
 * Connect once per process and reuse the connection.
 * Throws on failure instead of calling process.exit() — exiting would kill
 * the whole Vercel function (every endpoint would 500 until it cold-started).
 */
export function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }
  if (!connection) {
    attachListeners();
    connection = mongoose
      .connect(env.MONGODB_URI)
      .then((m) => {
        console.log('✅ MongoDB connected successfully');
        return m;
      })
      .catch((error) => {
        connection = null; // allow the next request to retry
        console.error('❌ MongoDB connection failed:', error);
        throw error;
      });
  }
  return connection;
}
