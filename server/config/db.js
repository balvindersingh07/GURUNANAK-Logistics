import mongoose from 'mongoose';
import { MONGODB_URI } from './env.js';

let connected = false;

export function isDbConnected() {
  return connected && mongoose.connection.readyState === 1;
}

export async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set — database features disabled');
    return false;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    connected = true;
    console.log('Connected to MongoDB');
    return true;
  } catch (err) {
    connected = false;
    console.error('MongoDB connection failed:', err.message);
    throw err;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    connected = false;
  }
}
