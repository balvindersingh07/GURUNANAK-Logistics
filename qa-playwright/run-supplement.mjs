/**
 * Supplemental Playwright checks for items affected by rate-limit / test order
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOT = path.join(__dirname, 'screenshots');
const API = 'http://localhost:5000/api';
const FE = 'http://localhost:5173';
const out = [];

function rec(name, pass, actual, expected = '') {
  out.push({ name, pass: pass ? 'PASS' : 'FAIL', actual, expected });
}

async function login(page, email, password) {
  await page.goto(`${FE}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForTimeout(4000);
}

async function apiLogin(email, password) {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return r.json();
}

const TINY = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext()).newPage();

// Create delivery
await login(page, 'admin@gurunanak.com', 'admin123');
await page.goto(`${FE}/deliveries/new`);
await page.waitForTimeout(2000);
await page.locator('select').first().selectOption({ index: 1 });
await page.getByPlaceholder(/Warehouse/i).fill('Supplement QA Pickup');
await page.getByPlaceholder(/Okhla/i).fill('Supplement QA Destination');
await page.getByRole('button', { name: 'Save Delivery' }).click();
await page.waitForTimeout(4000);
rec('Create delivery redirect', page.url().includes('/deliveries/') && !page.url().includes('/new'), page.url());

// Forgot password fresh
await page.goto(`${FE}/forgot-password`);
await page.waitForTimeout(1000);
const posts = [];
page.on('request', (r) => {
  if (r.url().includes('/auth/forgot-password') && r.method() === 'POST') posts.push(1);
});
await page.fill('input[type="email"]', 'admin@gurunanak.com');
await page.locator('form').evaluate((f) => f.requestSubmit());
await page.waitForTimeout(3000);
rec('Forgot password POST', posts.length > 0, String(posts.length));

// Driver POD on out_for_delivery
const driverAuth = await apiLogin('driver@gurunanak.com', 'driver123');
const dels = await fetch(`${API}/deliveries?status=out_for_delivery&limit=10`, {
  headers: { Authorization: `Bearer ${driverAuth.token}` },
}).then((r) => r.json());
const ofd = dels.data?.[0];
await login(page, 'driver@gurunanak.com', 'driver123');
await page.goto(`${FE}/driver/delivery`);
await page.waitForTimeout(5000);
const upload = await page.getByRole('button', { name: /Upload Photo/i }).count();
const canvas = await page.locator('canvas').count();
rec('Driver POD UI visible (out_for_delivery)', upload > 0 && canvas > 0, `upload=${upload} canvas=${canvas} delivery=${ofd?._id || 'none'}`);
await page.screenshot({ path: path.join(SHOT, 'driver-pod-supplement.png'), fullPage: true });

if (ofd && upload > 0) {
  await page.locator('input[type="file"]').setInputFiles({ name: 't.png', mimeType: 'image/png', buffer: TINY });
  await page.waitForTimeout(2000);
  const c = page.locator('canvas').first();
  const box = await c.boundingBox();
  if (box) {
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + 50);
    await page.mouse.up();
  }
  await page.getByRole('button', { name: 'Save Signature' }).click();
  await page.waitForTimeout(2000);
  rec('POD photo+signature saved', (await page.locator('text=Photo saved').count()) > 0 && (await page.locator('text=Signature saved').count()) > 0, 'saved');
}

// POD negative
if (ofd) {
  await fetch(`${API}/deliveries/${ofd._id}/proof`, { method: 'DELETE', headers: { Authorization: `Bearer ${driverAuth.token}` } }).catch(() => {});
  await page.reload();
  await page.waitForTimeout(3000);
  const btn = page.getByRole('button', { name: /^Delivered$/i });
  if (await btn.count()) {
    await btn.first().click();
    await page.waitForTimeout(1500);
    const t = await page.locator('body').innerText();
    rec('POD negative blocks delivered', /Complete proof|photo and signature|Proof of delivery/i.test(t), t.slice(0, 120));
  }
}

// Invalid JWT with reload
await page.goto(`${FE}/login`);
await page.evaluate(() => {
  localStorage.setItem('gnk_token', 'invalid.jwt.token');
  localStorage.setItem('gnk_auth', JSON.stringify({ name: 'Bad', email: 'bad@test.com', role: 'admin' }));
});
await page.goto(`${FE}/dashboard`);
await page.waitForTimeout(5000);
const url = page.url();
const token = await page.evaluate(() => localStorage.getItem('gnk_token'));
rec('Invalid JWT after navigation', url.includes('/login') || !token, `url=${url} token=${token ? 'present' : 'cleared'}`);

// Customer profile while logged in
await login(page, 'customer@gurunanak.com', 'customer123');
await page.goto(`${FE}/profile`);
await page.waitForTimeout(2000);
rec('Customer profile loads', page.url().includes('/profile'), page.url());

await browser.close();
fs.writeFileSync(path.join(__dirname, 'supplement.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
