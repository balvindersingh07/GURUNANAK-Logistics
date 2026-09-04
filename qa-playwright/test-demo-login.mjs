/**
 * P3-2 regression: each demo credential logs in successfully.
 */
import { chromium } from 'playwright';

const FE = 'http://localhost:5173';

const ACCOUNTS = [
  { role: 'admin', email: 'admin@gurunanak.com', password: 'admin123', expect: '/dashboard' },
  { role: 'dispatcher', email: 'dispatcher@gurunanak.com', password: 'dispatch123', expect: '/dashboard' },
  { role: 'driver', email: 'driver@gurunanak.com', password: 'driver123', expect: '/driver/dashboard' },
  { role: 'customer', email: 'customer@gurunanak.com', password: 'customer123', expect: '/customer/dashboard' },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const results = [];

for (const account of ACCOUNTS) {
  const page = await context.newPage();
  await page.goto(`${FE}/login`);
  await page.fill('input[type="email"]', account.email);
  await page.fill('input[type="password"]', account.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForTimeout(4000);
  const ok = page.url().includes(account.expect);
  results.push({ role: account.role, email: account.email, url: page.url(), pass: ok });
  await page.close();
}

await browser.close();
const pass = results.every((r) => r.pass);
console.log(JSON.stringify({ results, pass }, null, 2));
process.exit(pass ? 0 : 1);
