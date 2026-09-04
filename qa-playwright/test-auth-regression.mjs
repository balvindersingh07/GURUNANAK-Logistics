/**
 * P3-1 regression: invalid JWT must not expose protected dashboard content.
 */
import { chromium } from 'playwright';

const FE = 'http://localhost:5173';

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext()).newPage();

let sawDashboardContent = false;
page.on('framenavigated', async () => {
  const text = await page.locator('body').innerText().catch(() => '');
  if (/Rajesh Kumar|Total Deliveries|Fleet Overview/i.test(text) && !text.includes('Welcome Back')) {
    sawDashboardContent = true;
  }
});

await page.goto(`${FE}/login`);
await page.evaluate(() => {
  localStorage.setItem('gnk_token', 'invalid.jwt.token');
  localStorage.setItem(
    'gnk_auth',
    JSON.stringify({ id: 'bad', name: 'Bad User', email: 'bad@test.com', role: 'admin' }),
  );
});

await page.goto(`${FE}/dashboard`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

const url = page.url();
const token = await page.evaluate(() => localStorage.getItem('gnk_token'));
const auth = await page.evaluate(() => localStorage.getItem('gnk_auth'));
const body = await page.locator('body').innerText();
const onLogin = url.includes('/login');
const tokenCleared = !token;
const authCleared = !auth;
const noProtectedKpi = !/Total Deliveries|Active Drivers/i.test(body) || onLogin;

const result = {
  url,
  onLogin,
  tokenCleared,
  authCleared,
  sawDashboardContent,
  noProtectedKpi,
  pass: onLogin && tokenCleared && authCleared && !sawDashboardContent && noProtectedKpi,
};

// Valid login + refresh still works
if (result.pass) {
  await page.fill('input[type="email"]', 'admin@gurunanak.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  result.validLoginRefresh = page.url().includes('/dashboard');
  result.pass = result.pass && result.validLoginRefresh;
}

await browser.close();
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
