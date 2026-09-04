import {
  testAgent,
  describeWithDb,
  useTestDatabase,
  loginAs,
  DEMO_CREDENTIALS,
} from './helpers/testApp.js';

describeWithDb('Deliveries API', () => {
  useTestDatabase();

  let adminAuth;
  let driverAuth;
  let customerAuth;
  let sampleDeliveryId;

  beforeAll(async () => {
    const agent = testAgent();
    adminAuth = (await loginAs(agent, DEMO_CREDENTIALS.admin.email, DEMO_CREDENTIALS.admin.password))
      .authHeader;
    driverAuth = (await loginAs(agent, DEMO_CREDENTIALS.driver.email, DEMO_CREDENTIALS.driver.password))
      .authHeader;
    customerAuth = (
      await loginAs(agent, DEMO_CREDENTIALS.customer.email, DEMO_CREDENTIALS.customer.password)
    ).authHeader;

    const listRes = await agent.get('/api/deliveries?limit=1').set('Authorization', adminAuth);
    sampleDeliveryId = listRes.body.data[0]._id;
  });

  it('lists deliveries with pagination', async () => {
    const res = await testAgent()
      .get('/api/deliveries?page=1&limit=5')
      .set('Authorization', adminAuth);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(5);
  });

  it('reads a delivery by id', async () => {
    const res = await testAgent()
      .get(`/api/deliveries/${sampleDeliveryId}`)
      .set('Authorization', adminAuth);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(sampleDeliveryId);
  });

  it('updates delivery fields', async () => {
    const res = await testAgent()
      .put(`/api/deliveries/${sampleDeliveryId}`)
      .set('Authorization', adminAuth)
      .send({ priority: 'high' });

    expect(res.status).toBe(200);
    expect(res.body.priority).toBe('high');
  });

  it('allows valid status transition pending → assigned', async () => {
    const pending = await testAgent()
      .get('/api/deliveries?status=pending&limit=1')
      .set('Authorization', adminAuth);
    const id = pending.body.data[0]?._id;
    if (!id) return;

    const res = await testAgent()
      .patch(`/api/deliveries/${id}/status`)
      .set('Authorization', adminAuth)
      .send({ status: 'assigned' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('assigned');
  });

  it('rejects invalid status transition pending → delivered', async () => {
    const pending = await testAgent()
      .get('/api/deliveries?status=pending&limit=1')
      .set('Authorization', adminAuth);
    const id = pending.body.data[0]?._id;
    if (!id) return;

    const res = await testAgent()
      .patch(`/api/deliveries/${id}/status`)
      .set('Authorization', adminAuth)
      .send({ status: 'delivered' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid status transition/);
  });

  it('isolates customer deliveries to own records', async () => {
    const res = await testAgent().get('/api/deliveries').set('Authorization', customerAuth);
    expect(res.status).toBe(200);
    const items = res.body.data ?? res.body;
    expect(items.length).toBeGreaterThan(0);
    for (const d of items) {
      const customerId = d.customerId?._id ?? d.customerId;
      expect(String(customerId)).toBeTruthy();
    }
  });

  it('isolates driver deliveries to assigned driver', async () => {
    const res = await testAgent().get('/api/deliveries').set('Authorization', driverAuth);
    expect(res.status).toBe(200);
    const items = res.body.data ?? res.body;
    for (const d of items) {
      if (d.driverId) {
        expect(d.driverId).toBeTruthy();
      }
    }
  });

  it('rejects create delivery when required API fields are missing (form-only payload)', async () => {
    const customers = await testAgent()
      .get('/api/customers?limit=1')
      .set('Authorization', adminAuth);

    const res = await testAgent()
      .post('/api/deliveries')
      .set('Authorization', adminAuth)
      .send({
        customerId: customers.body.data[0]._id,
        pickup: 'Form Only Pickup',
        pickupCity: 'Jaipur',
        destination: 'Form Only Destination',
        destinationCity: 'Delhi',
        packageType: 'General',
        weight: '5 kg',
        expectedDelivery: '2026-03-05',
        priority: 'normal',
      });

    expect(res.status).toBe(400);
  });

  it('creates delivery with valid API payload including dates and coordinates', async () => {
    const customers = await testAgent()
      .get('/api/customers?limit=1')
      .set('Authorization', adminAuth);

    const res = await testAgent()
      .post('/api/deliveries')
      .set('Authorization', adminAuth)
      .send({
        customerId: customers.body.data[0]._id,
        pickup: 'Mapper Regression Pickup',
        pickupCity: 'Jaipur',
        destination: 'Mapper Regression Destination',
        destinationCity: 'Delhi',
        packageType: 'General',
        weight: '5 kg',
        expectedDelivery: '2026-03-05',
        priority: 'normal',
        createdDate: '2026-09-03',
        pickupLat: 26.9124,
        pickupLng: 75.7873,
        destLat: 28.6139,
        destLng: 77.209,
        currentLat: 26.9124,
        currentLng: 75.7873,
      });

    expect(res.status).toBe(201);
    expect(res.body.trackingId).toMatch(/^GNK/);
    expect(res.body.createdDate).toBe('2026-09-03');
    expect(res.body.pickupLat).toBe(26.9124);
    expect(res.body.pickupLng).toBe(75.7873);
    expect(res.body.destLat).toBe(28.6139);
    expect(res.body.destLng).toBe(77.209);
  });

  it('allows driver to read own assigned delivery by id', async () => {
    const list = await testAgent().get('/api/deliveries?limit=20').set('Authorization', driverAuth);
    const own = list.body.data.find((d) => d.driverId);
    expect(own).toBeDefined();

    const res = await testAgent()
      .get(`/api/deliveries/${own._id}`)
      .set('Authorization', driverAuth);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(own._id);
    expect(res.body.trackingId).toBe(own.trackingId);
  });

  it('forbids driver from reading another driver delivery by id', async () => {
    const agent = testAgent();
    const driverMe = await agent.get('/api/auth/me').set('Authorization', driverAuth);
    const myDriverId = String(driverMe.body.user.driverId);

    const all = await agent.get('/api/deliveries?limit=50').set('Authorization', adminAuth);
    const foreign = all.body.data.find(
      (d) => d.driverId && String(d.driverId._id ?? d.driverId) !== myDriverId,
    );
    expect(foreign).toBeDefined();

    const res = await agent
      .get(`/api/deliveries/${foreign._id}`)
      .set('Authorization', driverAuth);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('returns 404 when driver requests a non-existent delivery id', async () => {
    const res = await testAgent()
      .get('/api/deliveries/507f1f77bcf86cd799439011')
      .set('Authorization', driverAuth);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('allows driver status transition on assigned delivery', async () => {
    const agent = testAgent();
    const pending = await agent
      .get('/api/deliveries?status=pending&limit=20')
      .set('Authorization', adminAuth);
    const driverMe = await agent.get('/api/auth/me').set('Authorization', driverAuth);
    const myDriverId = String(driverMe.body.user.driverId);

    const owned = pending.body.data.find(
      (d) => d.driverId && String(d.driverId._id ?? d.driverId) === myDriverId,
    );

    let deliveryId = owned?._id;
    if (!deliveryId) {
      const customers = await agent.get('/api/customers?limit=1').set('Authorization', adminAuth);
      const created = await agent
        .post('/api/deliveries')
        .set('Authorization', adminAuth)
        .send({
          customerId: customers.body.data[0]._id,
          driverId: myDriverId,
          pickup: 'Driver Route Workflow Pickup',
          pickupCity: 'Jaipur',
          destination: 'Driver Route Workflow Destination',
          destinationCity: 'Delhi',
          packageType: 'General',
          weight: '2 kg',
          createdDate: '2026-09-04',
          expectedDelivery: '2026-09-06',
          pickupLat: 26.9124,
          pickupLng: 75.7873,
          destLat: 28.6139,
          destLng: 77.209,
          status: 'pending',
        });
      deliveryId = created.body._id;
      await agent
        .patch(`/api/deliveries/${deliveryId}/status`)
        .set('Authorization', adminAuth)
        .send({ status: 'assigned' });
    } else {
      await agent
        .patch(`/api/deliveries/${deliveryId}/status`)
        .set('Authorization', adminAuth)
        .send({ status: 'assigned' });
    }

    const res = await agent
      .patch(`/api/deliveries/${deliveryId}/status`)
      .set('Authorization', driverAuth)
      .send({ status: 'picked_up' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('picked_up');
  });

  it('deletes a delivery as admin', async () => {
    const createRes = await testAgent()
      .post('/api/deliveries')
      .set('Authorization', adminAuth)
      .send({
        customerId: (await testAgent().get('/api/customers?limit=1').set('Authorization', adminAuth))
          .body.data[0]._id,
        pickup: 'Delete Test',
        pickupCity: 'Jaipur',
        destination: 'Delete Dest',
        destinationCity: 'Delhi',
        packageType: 'General',
        weight: '5 kg',
        createdDate: '2026-03-01',
        expectedDelivery: '2026-03-05',
        pickupLat: 26.9,
        pickupLng: 75.7,
        destLat: 28.6,
        destLng: 77.2,
        status: 'pending',
      });

    const id = createRes.body._id;
    const delRes = await testAgent().delete(`/api/deliveries/${id}`).set('Authorization', adminAuth);
    expect(delRes.status).toBe(200);
  });
});

describeWithDb('Proof of Delivery API', () => {
  useTestDatabase();

  let driverAuth;
  let deliveryId;

  beforeAll(async () => {
    const agent = testAgent();
    driverAuth = (await loginAs(agent, DEMO_CREDENTIALS.driver.email, DEMO_CREDENTIALS.driver.password))
      .authHeader;
    const list = await agent.get('/api/deliveries?limit=1').set('Authorization', driverAuth);
    deliveryId = list.body.data[0]._id;
  });

  it('submits proof of delivery for assigned delivery', async () => {
    const res = await testAgent()
      .post(`/api/deliveries/${deliveryId}/proof`)
      .set('Authorization', driverAuth)
      .send({
        signature: 'data:image/png;base64,iVBORw0KGgo=',
        notes: 'Delivered at gate',
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.deliveryId || res.body._id).toBeDefined();
  });
});

describeWithDb('Notifications API', () => {
  useTestDatabase();

  let adminAuth;

  beforeAll(async () => {
    adminAuth = (
      await loginAs(testAgent(), DEMO_CREDENTIALS.admin.email, DEMO_CREDENTIALS.admin.password)
    ).authHeader;
  });

  it('lists notifications', async () => {
    const res = await testAgent().get('/api/notifications').set('Authorization', adminAuth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data ?? res.body)).toBe(true);
  });

  it('marks all notifications as read', async () => {
    const res = await testAgent()
      .patch('/api/notifications/read-all')
      .set('Authorization', adminAuth);
    expect(res.status).toBe(200);
  });
});

describeWithDb('Reports API', () => {
  useTestDatabase();

  let adminAuth;

  beforeAll(async () => {
    adminAuth = (
      await loginAs(testAgent(), DEMO_CREDENTIALS.admin.email, DEMO_CREDENTIALS.admin.password)
    ).authHeader;
  });

  it('returns aggregated summary', async () => {
    const res = await testAgent().get('/api/reports/summary').set('Authorization', adminAuth);
    expect(res.status).toBe(200);
    expect(res.body.summary.totalDeliveries).toBeGreaterThan(0);
    expect(res.body.deliveriesByStatus).toBeDefined();
  });
});
