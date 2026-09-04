import request from 'supertest';
import { app } from '../../index.js';
import { isDbTestEnabled } from './dbHelper.js';

export { app };

export const describeWithDb = isDbTestEnabled() ? describe : describe.skip;

export function useTestDatabase() {
  // Database initialized via globalSetup.js
}

export function testAgent() {
  return request(app);
}

export async function loginAs(agent, email, password) {
  const res = await agent.post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const token = res.body.token;
  return {
    token,
    user: res.body.user,
    authHeader: `Bearer ${token}`,
  };
}

export const DEMO_CREDENTIALS = {
  admin: { email: 'admin@gurunanak.com', password: 'admin123' },
  dispatcher: { email: 'dispatcher@gurunanak.com', password: 'dispatch123' },
  driver: { email: 'driver@gurunanak.com', password: 'driver123' },
  customer: { email: 'customer@gurunanak.com', password: 'customer123' },
};
