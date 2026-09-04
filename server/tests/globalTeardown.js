process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gnk_test';

export default async function globalTeardown() {
  const { disconnectTestDatabase } = await import('./helpers/dbHelper.js');
  const { server } = await import('../index.js');
  const { stopTrackingSimulator } = await import('../services/trackingSimulator.js');
  stopTrackingSimulator();
  await disconnectTestDatabase();
  await new Promise((resolve) => server.close(resolve));
}

