import { connectTestDatabase } from './helpers/dbHelper.js';

beforeAll(async () => {
  await connectTestDatabase();
}, 60000);
