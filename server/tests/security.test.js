import mongoose from 'mongoose';
import { io as Client } from 'socket.io-client';
import Notification from '../models/Notification.js';
import ProofOfDelivery from '../models/ProofOfDelivery.js';
import {
  testAgent,
  describeWithDb,
  useTestDatabase,
  loginAs,
  DEMO_CREDENTIALS,
} from './helpers/testApp.js';
import { server } from '../index.js';

describeWithDb('Proof of Delivery — partial updates', () => {
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

  it('preserves signature when uploading photo in a separate request', async () => {
    const agent = testAgent();

    await agent
      .post(`/api/deliveries/${deliveryId}/proof`)
      .set('Authorization', driverAuth)
      .send({ signature: 'data:image/png;base64,SIG1' });

    const res = await agent
      .post(`/api/deliveries/${deliveryId}/proof`)
      .set('Authorization', driverAuth)
      .send({ photoUrl: 'data:image/png;base64,PHOTO1' });

    expect(res.status).toBe(200);
    expect(res.body.signature).toBe('data:image/png;base64,SIG1');
    expect(res.body.photoUrl).toBe('data:image/png;base64,PHOTO1');
  });

  it('preserves photo when saving signature in a separate request', async () => {
    const agent = testAgent();

    const res = await agent
      .post(`/api/deliveries/${deliveryId}/proof`)
      .set('Authorization', driverAuth)
      .send({ signature: 'data:image/png;base64,SIG2' });

    expect(res.status).toBe(200);
    expect(res.body.photoUrl).toBe('data:image/png;base64,PHOTO1');
    expect(res.body.signature).toBe('data:image/png;base64,SIG2');
  });
});

describeWithDb('Delivered status — POD enforcement', () => {
  useTestDatabase();

  let driverAuth;
  let adminAuth;
  let deliveryId;

  beforeAll(async () => {
    const agent = testAgent();
    const driverLogin = await loginAs(
      agent,
      DEMO_CREDENTIALS.driver.email,
      DEMO_CREDENTIALS.driver.password,
    );
    driverAuth = driverLogin.authHeader;
    adminAuth = (await loginAs(agent, DEMO_CREDENTIALS.admin.email, DEMO_CREDENTIALS.admin.password))
      .authHeader;

    const existing = await agent
      .get('/api/deliveries?status=out_for_delivery&limit=50')
      .set('Authorization', driverAuth);

    if (existing.body.data?.[0]) {
      deliveryId = existing.body.data[0]._id;
      return;
    }

    const customers = await agent.get('/api/customers?limit=1').set('Authorization', adminAuth);
    const createRes = await agent
      .post('/api/deliveries')
      .set('Authorization', adminAuth)
      .send({
        customerId: customers.body.data[0]._id,
        driverId: driverLogin.user.driverId,
        pickup: 'POD Enforcement Pickup',
        pickupCity: 'Jaipur',
        destination: 'POD Enforcement Destination',
        destinationCity: 'Delhi',
        packageType: 'General',
        weight: '5 kg',
        createdDate: '2026-03-01',
        expectedDelivery: '2026-03-05',
        pickupLat: 26.9124,
        pickupLng: 75.7873,
        destLat: 28.6139,
        destLng: 77.209,
        status: 'pending',
      });

    deliveryId = createRes.body._id;
    for (const status of ['assigned', 'picked_up', 'in_transit', 'out_for_delivery']) {
      await agent
        .patch(`/api/deliveries/${deliveryId}/status`)
        .set('Authorization', adminAuth)
        .send({ status });
    }
  });

  it('rejects driver marking delivered without complete POD', async () => {
    await ProofOfDelivery.deleteOne({ deliveryId });

    const res = await testAgent()
      .patch(`/api/deliveries/${deliveryId}/status`)
      .set('Authorization', driverAuth)
      .send({ status: 'delivered' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Proof of delivery/i);
  });

  it('allows driver marking delivered when photo and signature exist', async () => {
    const agent = testAgent();
    await agent
      .post(`/api/deliveries/${deliveryId}/proof`)
      .set('Authorization', driverAuth)
      .send({
        photoUrl: 'data:image/png;base64,FINALPHOTO',
        signature: 'data:image/png;base64,FINALSIG',
      });

    const res = await agent
      .patch(`/api/deliveries/${deliveryId}/status`)
      .set('Authorization', driverAuth)
      .send({ status: 'delivered' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('delivered');
  });
});

describeWithDb('Proof GET — access control', () => {
  useTestDatabase();

  let driverAuth;
  let customerAuth;
  let adminAuth;
  let deliveryId;

  beforeAll(async () => {
    const agent = testAgent();
    driverAuth = (await loginAs(agent, DEMO_CREDENTIALS.driver.email, DEMO_CREDENTIALS.driver.password))
      .authHeader;
    customerAuth = (
      await loginAs(agent, DEMO_CREDENTIALS.customer.email, DEMO_CREDENTIALS.customer.password)
    ).authHeader;
    adminAuth = (await loginAs(agent, DEMO_CREDENTIALS.admin.email, DEMO_CREDENTIALS.admin.password))
      .authHeader;

    const list = await agent.get('/api/deliveries?limit=1').set('Authorization', driverAuth);
    deliveryId = list.body.data[0]._id;

    await agent
      .post(`/api/deliveries/${deliveryId}/proof`)
      .set('Authorization', driverAuth)
      .send({ signature: 'data:image/png;base64,READTEST' });
  });

  it('allows assigned driver to read POD', async () => {
    const res = await testAgent()
      .get(`/api/deliveries/${deliveryId}/proof`)
      .set('Authorization', driverAuth);
    expect(res.status).toBe(200);
    expect(res.body.signature).toBeDefined();
  });

  it('allows admin to read POD', async () => {
    const res = await testAgent()
      .get(`/api/deliveries/${deliveryId}/proof`)
      .set('Authorization', adminAuth);
    expect(res.status).toBe(200);
  });

  it('forbids unrelated customer from reading POD for another delivery', async () => {
    const agent = testAgent();
    const customerMe = await agent.get('/api/auth/me').set('Authorization', customerAuth);
    const myCustomerId = String(customerMe.body.user.customerId);

    const driverDeliveries = await agent
      .get('/api/deliveries?limit=50')
      .set('Authorization', driverAuth);
    const foreignDelivery = driverDeliveries.body.data.find(
      (d) => String(d.customerId?._id ?? d.customerId) !== myCustomerId,
    );

    expect(foreignDelivery).toBeDefined();

    const res = await agent
      .get(`/api/deliveries/${foreignDelivery._id}/proof`)
      .set('Authorization', customerAuth);
    expect(res.status).toBe(403);
  });
});

describeWithDb('Notification ownership', () => {
  useTestDatabase();

  let driverAuth;
  let customerAuth;
  let adminAuth;
  let driverUserId;
  let customerUserId;

  beforeAll(async () => {
    const agent = testAgent();
    const driverLogin = await loginAs(agent, DEMO_CREDENTIALS.driver.email, DEMO_CREDENTIALS.driver.password);
    driverAuth = driverLogin.authHeader;
    driverUserId = driverLogin.user.id;

    const customerLogin = await loginAs(
      agent,
      DEMO_CREDENTIALS.customer.email,
      DEMO_CREDENTIALS.customer.password,
    );
    customerAuth = customerLogin.authHeader;
    customerUserId = customerLogin.user.id;

    adminAuth = (await loginAs(agent, DEMO_CREDENTIALS.admin.email, DEMO_CREDENTIALS.admin.password))
      .authHeader;
  });

  it('forbids driver from marking another user notification as read', async () => {
    const owned = await Notification.create({
      type: 'system_alert',
      title: 'Customer only',
      message: 'Private',
      userId: new mongoose.Types.ObjectId(customerUserId),
    });

    const res = await testAgent()
      .patch(`/api/notifications/${owned._id}/read`)
      .set('Authorization', driverAuth);

    expect(res.status).toBe(403);
  });

  it('allows admin to mark any notification as read', async () => {
    const owned = await Notification.create({
      type: 'system_alert',
      title: 'Driver only',
      message: 'Private',
      userId: new mongoose.Types.ObjectId(driverUserId),
    });

    const res = await testAgent()
      .patch(`/api/notifications/${owned._id}/read`)
      .set('Authorization', adminAuth);

    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);
  });

  it('forbids customer from deleting another user notification', async () => {
    const owned = await Notification.create({
      type: 'system_alert',
      title: 'Driver only delete',
      message: 'Private',
      userId: new mongoose.Types.ObjectId(driverUserId),
    });

    const res = await testAgent()
      .delete(`/api/notifications/${owned._id}`)
      .set('Authorization', customerAuth);

    expect(res.status).toBe(403);
  });
});

describeWithDb('Socket.IO authentication and room authorization', () => {
  useTestDatabase();

  let port;
  let driverToken;
  let customerToken;
  let deliveryId;

  beforeAll(async () => {
    if (!server.listening) {
      await new Promise((resolve) => server.listen(0, resolve));
    }
    port = server.address().port;

    const agent = testAgent();
    driverToken = (
      await loginAs(agent, DEMO_CREDENTIALS.driver.email, DEMO_CREDENTIALS.driver.password)
    ).token;
    customerToken = (
      await loginAs(agent, DEMO_CREDENTIALS.customer.email, DEMO_CREDENTIALS.customer.password)
    ).token;

    const list = await agent
      .get('/api/deliveries?limit=50')
      .set('Authorization', `Bearer ${driverToken}`);
    const meCustomer = await agent
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${customerToken}`);
    const myCustomerId = String(meCustomer.body.user.customerId);

    const foreignDelivery = list.body.data.find(
      (d) => String(d.customerId?._id ?? d.customerId) !== myCustomerId,
    );
    expect(foreignDelivery).toBeDefined();
    deliveryId = foreignDelivery._id;
  });

  afterAll((done) => {
    if (server.listening) server.close(done);
    else done();
  });

  it('rejects socket connection without JWT', (done) => {
    const client = Client(`http://127.0.0.1:${port}`, {
      transports: ['websocket'],
      reconnection: false,
    });

    client.on('connect_error', (err) => {
      expect(err.message).toMatch(/Authentication|Invalid token/i);
      client.close();
      done();
    });
  });

  it('allows authenticated driver to subscribe to assigned delivery', (done) => {
    const client = Client(`http://127.0.0.1:${port}`, {
      transports: ['websocket'],
      reconnection: false,
      auth: { token: driverToken },
    });

    client.on('connect', () => {
      client.emit('track:subscribe', deliveryId, (response) => {
        expect(response?.ok).toBe(true);
        client.close();
        done();
      });
    });

    client.on('connect_error', (err) => {
      client.close();
      done(err);
    });
  });

  it('rejects customer subscribing to unrelated delivery room', (done) => {
    const client = Client(`http://127.0.0.1:${port}`, {
      transports: ['websocket'],
      reconnection: false,
      auth: { token: customerToken },
    });

    client.on('connect', () => {
      client.emit('track:subscribe', deliveryId, (response) => {
        expect(response?.error).toBeDefined();
        client.close();
        done();
      });
    });

    client.on('connect_error', (err) => {
      client.close();
      done(err);
    });
  });
});

describeWithDb('Bulk proofs endpoint', () => {
  useTestDatabase();

  let driverAuth;

  beforeAll(async () => {
    driverAuth = (
      await loginAs(testAgent(), DEMO_CREDENTIALS.driver.email, DEMO_CREDENTIALS.driver.password)
    ).authHeader;
  });

  it('lists proofs for accessible deliveries only', async () => {
    const res = await testAgent().get('/api/deliveries/proofs').set('Authorization', driverAuth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
