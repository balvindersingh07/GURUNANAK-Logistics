import {
  testAgent,
  describeWithDb,
  useTestDatabase,
  loginAs,
  DEMO_CREDENTIALS,
} from './helpers/testApp.js';

describeWithDb('RBAC', () => {
  useTestDatabase();

  let adminAuth;
  let dispatcherAuth;
  let driverAuth;
  let customerAuth;

  beforeAll(async () => {
    const agent = testAgent();
    adminAuth = (await loginAs(agent, DEMO_CREDENTIALS.admin.email, DEMO_CREDENTIALS.admin.password))
      .authHeader;
    dispatcherAuth = (
      await loginAs(agent, DEMO_CREDENTIALS.dispatcher.email, DEMO_CREDENTIALS.dispatcher.password)
    ).authHeader;
    driverAuth = (await loginAs(agent, DEMO_CREDENTIALS.driver.email, DEMO_CREDENTIALS.driver.password))
      .authHeader;
    customerAuth = (
      await loginAs(agent, DEMO_CREDENTIALS.customer.email, DEMO_CREDENTIALS.customer.password)
    ).authHeader;
  });

  it('allows admin to list drivers', async () => {
    const res = await testAgent().get('/api/drivers').set('Authorization', adminAuth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data ?? res.body)).toBeTruthy();
  });

  it('allows dispatcher to list drivers', async () => {
    const res = await testAgent().get('/api/drivers').set('Authorization', dispatcherAuth);
    expect(res.status).toBe(200);
  });

  it('forbids driver from listing drivers', async () => {
    const res = await testAgent().get('/api/drivers').set('Authorization', driverAuth);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('forbids customer from listing drivers', async () => {
    const res = await testAgent().get('/api/drivers').set('Authorization', customerAuth);
    expect(res.status).toBe(403);
  });

  it('allows admin to create a delivery', async () => {
    const listRes = await testAgent()
      .get('/api/deliveries?limit=1')
      .set('Authorization', adminAuth);
    const sample = listRes.body.data?.[0] ?? listRes.body[0];
    expect(sample).toBeDefined();

    const res = await testAgent()
      .post('/api/deliveries')
      .set('Authorization', adminAuth)
      .send({
        customerId: sample.customerId._id ?? sample.customerId,
        pickup: 'RBAC Test Pickup',
        pickupCity: 'Jaipur',
        destination: 'RBAC Test Destination',
        destinationCity: 'Delhi',
        packageType: 'Electronics',
        weight: '10 kg',
        createdDate: '2026-03-01',
        expectedDelivery: '2026-03-05',
        pickupLat: 26.9124,
        pickupLng: 75.7873,
        destLat: 28.6139,
        destLng: 77.209,
        status: 'pending',
      });

    expect(res.status).toBe(201);
    expect(res.body.trackingId).toBeDefined();
  });

  it('forbids customer from creating deliveries', async () => {
    const res = await testAgent()
      .post('/api/deliveries')
      .set('Authorization', customerAuth)
      .send({
        customerId: '507f1f77bcf86cd799439011',
        pickup: 'X',
        pickupCity: 'Jaipur',
        destination: 'Y',
        destinationCity: 'Delhi',
        packageType: 'Electronics',
        weight: '1 kg',
        createdDate: '2026-03-01',
        expectedDelivery: '2026-03-05',
        pickupLat: 26.9,
        pickupLng: 75.7,
        destLat: 28.6,
        destLng: 77.2,
      });

    expect(res.status).toBe(403);
  });

  it('forbids driver from deleting deliveries', async () => {
    const listRes = await testAgent()
      .get('/api/deliveries?limit=1')
      .set('Authorization', adminAuth);
    const id = listRes.body.data[0]._id;

    const res = await testAgent()
      .delete(`/api/deliveries/${id}`)
      .set('Authorization', driverAuth);

    expect(res.status).toBe(403);
  });

  it('forbids dispatcher from creating drivers', async () => {
    const res = await testAgent()
      .post('/api/drivers')
      .set('Authorization', dispatcherAuth)
      .send({
        name: 'Test Driver',
        phone: '+919999999999',
        email: 'testdriver@example.com',
        licenseNumber: 'RJ-TEST-123',
        licenseExpiry: '2028-01-01',
        address: 'Jaipur',
      });

    expect(res.status).toBe(403);
  });
});
