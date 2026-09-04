# GURUNANAK Playwright QA

Browser regression tests run against a live frontend + backend dev stack.

## Prerequisites

- Frontend: `http://localhost:5173` (Vite)
- Backend: `http://localhost:5000` (Express + MongoDB)
- Playwright deps: `npm install` in this folder

## Rate limiting (P3-4)

Production keeps strict limits (300 API req/min, 100 auth req/15 min).

**Development and test** use higher defaults automatically (`NODE_ENV !== production`):

- API: 5000 req/min
- Auth: 1000 req/15 min

Optional overrides in `server/.env`:

```env
RATE_LIMIT_API_MAX=5000
RATE_LIMIT_AUTH_MAX=1000
```

Restart the backend after changing env vars. Do **not** set high limits in production.

## Recommended QA sequence

Run tests in order with short pauses to avoid bursts on a production-configured server:

```bash
npm run lint
npm run build
npm run test:server
node test-auth-regression.mjs
node test-demo-login.mjs
node test-create-delivery.mjs
node test-driver-delivery-route.mjs
node run-qa.mjs
```

## Scripts

| Script | Purpose |
|--------|---------|
| `run-qa.mjs` | Full E2E suite → `results.json` |
| `test-auth-regression.mjs` | Invalid JWT guard |
| `test-demo-login.mjs` | All demo role logins |
| `test-create-delivery.mjs` | P1 create delivery |
| `test-driver-delivery-route.mjs` | P2 driver `:id` routing |

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gurunanak.com | admin123 |
| Dispatcher | dispatcher@gurunanak.com | dispatch123 |
| Driver | driver@gurunanak.com | driver123 |
| Customer | customer@gurunanak.com | customer123 |
