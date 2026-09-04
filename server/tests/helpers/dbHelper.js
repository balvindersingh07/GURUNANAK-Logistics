import mongoose from 'mongoose';
import { connectDB, disconnectDB, isDbConnected } from '../../config/db.js';
import { seedIfEmpty } from '../../services/seedData.js';

let dbInitialized = false;
let initPromise = null;

export async function connectTestDatabase() {
  if (dbInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) return false;

    if (!isDbConnected()) {
      await connectDB();
    }

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
      await seedIfEmpty();
      dbInitialized = true;
    }

    return dbInitialized;
  })();

  return initPromise;
}

export async function disconnectTestDatabase() {
  if (!isDbConnected()) {
    dbInitialized = false;
    initPromise = null;
    return;
  }

  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }
  } finally {
    await disconnectDB();
    dbInitialized = false;
    initPromise = null;
  }
}

export function isDbTestEnabled() {
  return Boolean(process.env.MONGODB_URI?.trim());
}
