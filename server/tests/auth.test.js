import {
  testAgent,
  describeWithDb,
  useTestDatabase,
  loginAs,
  DEMO_CREDENTIALS,
} from './helpers/testApp.js';

describe('GET /api/health', () => {
  it('returns service health status', async () => {
    const res = await testAgent().get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('GURUNANAK Logistics API');
    expect(typeof res.body.mongo).toBe('boolean');
  });

  it('returns JSON content type', async () => {
    const res = await testAgent().get('/api/health');
    expect(res.headers['content-type']).toMatch(/json/);
  });
});

describe('POST /api/auth/login (validation)', () => {
  it('rejects invalid email format', async () => {
    const res = await testAgent()
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'admin123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'email' })]),
    );
  });

  it('rejects password shorter than 6 characters', async () => {
    const res = await testAgent()
      .post('/api/auth/login')
      .send({ email: 'admin@gurunanak.com', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'password' })]),
    );
  });

  it('rejects missing credentials', async () => {
    const res = await testAgent().post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});

describeWithDb('Auth API (database)', () => {
  useTestDatabase();

  it('logs in with valid admin credentials', async () => {
    const agent = testAgent();
    const { token, user } = await loginAs(
      agent,
      DEMO_CREDENTIALS.admin.email,
      DEMO_CREDENTIALS.admin.password,
    );

    expect(token).toEqual(expect.any(String));
    expect(user.role).toBe('admin');
    expect(user.email).toBe(DEMO_CREDENTIALS.admin.email);
  });

  it('rejects invalid password', async () => {
    const res = await testAgent()
      .post('/api/auth/login')
      .send({ email: DEMO_CREDENTIALS.admin.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('registers a new customer account', async () => {
    const email = `testuser_${Date.now()}@example.com`;
    const res = await testAgent().post('/api/auth/register').send({
      name: 'Test Customer',
      email,
      phone: '+919876543210',
      password: 'secret123',
      role: 'customer',
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Account created');
    expect(res.body.userId).toBeDefined();
  });

  it('returns current user from GET /api/auth/me', async () => {
    const agent = testAgent();
    const { authHeader } = await loginAs(
      agent,
      DEMO_CREDENTIALS.dispatcher.email,
      DEMO_CREDENTIALS.dispatcher.password,
    );

    const res = await agent.get('/api/auth/me').set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(DEMO_CREDENTIALS.dispatcher.email);
    expect(res.body.user.role).toBe('dispatcher');
  });

  it('returns generic message for forgot-password (unknown email)', async () => {
    const res = await testAgent()
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/If the account exists/);
    expect(res.body.resetToken).toBeUndefined();
  });

  it('returns generic message for forgot-password (known email)', async () => {
    const res = await testAgent()
      .post('/api/auth/forgot-password')
      .send({ email: DEMO_CREDENTIALS.admin.email });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/If the account exists/);
  });
});
