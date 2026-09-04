/**
 * API + browser verification for create delivery P1 fix
 */
import { chromium } from 'playwright';

const API = 'http://localhost:5000/api';
const FE = 'http://localhost:5173';
const CITY_COORDS = {
  Jaipur: [26.9124, 75.7873],
  Delhi: [28.6139, 77.209],
};

function deliveryToApi(data, { forCreate = false } = {}) {
  const { id: _id, ...rest } = data;
  const payload = { ...rest };
  const pickupCity = String(payload.pickupCity ?? '');
  const destinationCity = String(payload.destinationCity ?? '');
  if (pickupCity && payload.pickupLat == null) {
    const c = CITY_COORDS[pickupCity];
    if (c) {
      payload.pickupLat = c[0];
      payload.pickupLng = c[1];
    }
  }
  if (destinationCity && payload.destLat == null) {
    const c = CITY_COORDS[destinationCity];
    if (c) {
      payload.destLat = c[0];
      payload.destLng = c[1];
    }
  }
  if (forCreate && !payload.createdDate) {
    payload.createdDate = new Date().toISOString().split('T')[0];
  }
  if (payload.currentLat == null && payload.pickupLat != null) {
    payload.currentLat = payload.pickupLat;
    payload.currentLng = payload.pickupLng;
  }
  return payload;
}

async function apiLogin(email, password) {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return r.json();
}

const admin = await apiLogin('admin@gurunanak.com', 'admin123');
const customers = await fetch(`${API}/customers?limit=1`, {
  headers: { Authorization: `Bearer ${admin.token}` },
}).then((r) => r.json());

const formOnly = {
  customerId: customers.data[0]._id,
  pickup: 'Mapper Form Pickup',
  pickupCity: 'Jaipur',
  destination: 'Mapper Form Destination',
  destinationCity: 'Delhi',
  packageType: 'General',
  weight: '5 kg',
  expectedDelivery: '2026-09-05',
  priority: 'normal',
};

const invalidRes = await fetch(`${API}/deliveries`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${admin.token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(formOnly),
});
const enriched = deliveryToApi(formOnly, { forCreate: true });
const validRes = await fetch(`${API}/deliveries`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${admin.token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(enriched),
});
const validBody = await validRes.json();

const apiResult = {
  invalidStatus: invalidRes.status,
  validStatus: validRes.status,
  trackingId: validBody.trackingId,
  createdDate: validBody.createdDate,
  pickupLat: validBody.pickupLat,
  destLat: validBody.destLat,
};

let browserResult = { pass: false, reason: 'not run' };
try {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const posts = [];
  page.on('response', (res) => {
    if (res.url().includes('/api/deliveries') && res.request().method() === 'POST') {
      posts.push(res.status());
    }
  });

  await page.goto(`${FE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@gurunanak.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });

  await page.goto(`${FE}/deliveries/new`, { waitUntil: 'networkidle' });
  await page.waitForSelector('select', { timeout: 15000 });
  await page.locator('select').first().selectOption({ index: 1 });
  await page.getByPlaceholder(/Warehouse/i).fill('Browser P1 Fix Pickup');
  await page.getByPlaceholder(/Okhla/i).fill('Browser P1 Fix Destination');
  await page.getByRole('button', { name: 'Save Delivery' }).click();
  await page.waitForTimeout(5000);

  const url = page.url();
  browserResult = {
    pass: posts.at(-1) === 201 && url.includes('/deliveries/') && !url.includes('/new'),
    postStatus: posts.at(-1) ?? 'none',
    finalUrl: url,
  };
  await browser.close();
} catch (e) {
  browserResult = { pass: false, reason: String(e) };
}

console.log(JSON.stringify({ apiResult, browserResult }, null, 2));
process.exit(
  apiResult.invalidStatus === 400 &&
    apiResult.validStatus === 201 &&
    apiResult.trackingId &&
    browserResult.pass
    ? 0
    : 1,
);
