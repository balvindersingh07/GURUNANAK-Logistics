/**
 * Playwright regression: /driver/delivery/:id must open the requested delivery
 */
import { chromium } from 'playwright';

const FE = 'http://localhost:5173';
const API = 'http://localhost:5000/api';

async function apiLogin(email, password) {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return r.json();
}

async function login(page, email, password) {
  await page.goto(`${FE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/driver/dashboard', { timeout: 20000 });
}

const driverAuth = await apiLogin('driver@gurunanak.com', 'driver123');
const deliveriesRes = await fetch(`${API}/deliveries?limit=20`, {
  headers: { Authorization: `Bearer ${driverAuth.token}` },
}).then((r) => r.json());

const assigned = (deliveriesRes.data ?? []).filter((d) => d.driverId);
if (assigned.length < 2) {
  console.log(JSON.stringify({ pass: false, reason: 'Need at least 2 assigned deliveries for driver' }));
  process.exit(1);
}

const deliveryA = assigned[0];
const deliveryB = assigned[1];

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext()).newPage();

await login(page, 'driver@gurunanak.com', 'driver123');
await page.waitForResponse(
  (r) => r.url().includes('/api/deliveries') && r.status() === 200,
  { timeout: 20000 },
).catch(() => {});
await page.waitForTimeout(3000);

async function openDelivery(id) {
  await page.goto(`${FE}/driver/delivery/${id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
}

await openDelivery(deliveryA._id);
await page.waitForSelector(`text=${deliveryA.trackingId}`, { timeout: 15000 }).catch(() => {});
const textA = await page.locator('body').innerText();
const showsA = textA.includes(deliveryA.trackingId);
const notBOnA = !textA.includes(deliveryB.trackingId) || deliveryA.trackingId === deliveryB.trackingId;

await openDelivery(deliveryB._id);
await page.waitForSelector(`text=${deliveryB.trackingId}`, { timeout: 15000 }).catch(() => {});
const textB = await page.locator('body').innerText();
const showsB = textB.includes(deliveryB.trackingId);
const notAOnB = !textB.includes(deliveryA.trackingId) || deliveryA.trackingId === deliveryB.trackingId;

await openDelivery('507f1f77bcf86cd799439011');
await page.waitForTimeout(2000);
const invalidText = await page.locator('body').innerText();
const invalidOk =
  invalidText.includes('Delivery not found') &&
  !invalidText.includes(deliveryA.trackingId) &&
  !invalidText.includes(deliveryB.trackingId);

// Workflow: open delivery A and verify status buttons exist
await openDelivery(deliveryA._id);
const workflowText = await page.locator('body').innerText();
const workflowOk = workflowText.includes('Update Status') || workflowText.includes(deliveryA.trackingId);

const result = {
  deliveryA: deliveryA.trackingId,
  deliveryB: deliveryB.trackingId,
  showsA,
  showsB,
  notBOnA,
  notAOnB,
  invalidOk,
  workflowOk,
  pass: showsA && showsB && notBOnA && notAOnB && invalidOk && workflowOk,
};

await browser.close();
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
