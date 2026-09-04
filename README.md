# GURUNANAK Transportation & Logistics

**Moving Every Delivery Forward**

Enterprise-grade transportation, logistics, fleet management and delivery tracking SaaS platform with a premium rainbow UI, real-time maps, and role-based access control.

## Architecture

```
┌─────────────────┐     JWT + REST      ┌──────────────────┐     Mongoose     ┌──────────┐
│  React (Vite)   │ ◄──────────────────► │  Express API     │ ◄──────────────► │ MongoDB  │
│  Service layer  │     Socket.IO        │  RBAC + Zod      │                  └──────────┘
└────────┬────────┘                      └──────────────────┘
         │
         ▼ (API unavailable)
┌─────────────────┐
│ AppContext +    │
│ localStorage    │  ← Demo fallback (no errors shown to user)
└─────────────────┘
```

### DEMO MODE vs FULL-STACK MODE

| | **Demo Mode** | **Full-Stack Mode** |
|---|----------------|---------------------|
| Trigger | API health check fails or MongoDB unavailable | `GET /api/health` returns `mongo: true` |
| Auth | Demo users in `gnk_users` localStorage | JWT in `gnk_token` via `/api/auth/login` |
| Data | `gnk_app_data` localStorage | MongoDB via REST services |
| Passwords | Demo only (never stored in `gnk_auth`) | bcrypt on server; not returned in API |
| Tracking | Client-side simulation | Socket.IO + 30s GPS simulator on server |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Routing | React Router (lazy-loaded routes) |
| UI | Lucide React, Recharts, Leaflet + OpenStreetMap |
| State | React Context + service layer with demo fallback |
| Backend | Node.js, Express.js, Socket.IO |
| Auth | JWT + bcrypt |
| Validation | Zod (backend), strict delivery status transitions |
| Database | MongoDB / MongoDB Atlas |
| DevOps | Docker (HEALTHCHECK), GitHub Actions, k6 load scripts |
| Deploy | Vercel (frontend), Render (backend) |

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full CRUD: users, drivers, fleet, customers, routes, deliveries, reports, settings |
| **Dispatcher** | Operations: deliveries, driver assignment, routes, live tracking, reports |
| **Driver** | Own assigned deliveries, status workflow, proof of delivery |
| **Customer** | Own deliveries and tracking only |

## Features

- JWT authentication with automatic demo fallback
- Full CRUD for deliveries, drivers, fleet, customers, routes
- Paginated list APIs (`?page=1&limit=20`)
- Strict delivery status transition validation (backend + frontend)
- Socket.IO live updates (`track:subscribe`, `delivery:updated`, location events)
- Simulated GPS (30s interval) via `trackingSimulator.js` — replaceable via `gpsAdapter.js`
- Proof of delivery API + canvas signature capture
- Notification REST API
- Rate limiting on auth and API routes
- 20+ backend integration tests (Jest + Supertest)

## Quick Start

### Frontend only (demo mode)

```bash
npm install
npm run dev
```

Open http://localhost:5173 — works without backend.

### Full stack

```bash
# Terminal 1 — Frontend
npm install && npm run dev

# Terminal 2 — Backend
cd server
cp .env.example .env
# Set MONGODB_URI and JWT_SECRET
npm install && npm run dev
```

Set frontend `.env`:

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gurunanak.com | admin123 |
| Dispatcher | dispatcher@gurunanak.com | dispatch123 |
| Driver | driver@gurunanak.com | driver123 |
| Customer | customer@gurunanak.com | customer123 |

Or click **Continue as Demo User** on the login page.

## Environment Variables

See `.env.example` for all variable names (no secrets committed):

- `JWT_SECRET`, `MONGODB_URI`, `PORT`, `CORS_ORIGIN`, `NODE_ENV`
- `VITE_API_URL`, `VITE_SOCKET_URL`
- `CLOUDINARY_URL` (optional — proof photo upload)
- `EMAIL_PROVIDER` (optional — password reset emails)
- `BASE_URL`, `AUTH_TOKEN` (k6 load tests)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health + MongoDB status |
| POST | `/api/auth/login` | Login → JWT |
| POST | `/api/auth/register` | Register |
| GET | `/api/auth/me` | Current user (JWT) |
| POST | `/api/auth/forgot-password` | Password reset request |
| POST | `/api/auth/reset-password` | Reset with token |
| GET/POST/PUT/DELETE | `/api/deliveries` | Delivery CRUD (paginated GET) |
| PATCH | `/api/deliveries/:id/status` | Status update (validated transitions) |
| POST | `/api/deliveries/:id/proof` | Proof of delivery |
| GET/POST/PUT/DELETE | `/api/drivers` | Drivers (admin write) |
| GET/POST/PUT/DELETE | `/api/vehicles` | Fleet (admin write) |
| GET/POST/PUT/DELETE | `/api/customers` | Customers (admin write) |
| GET/POST/PUT/DELETE | `/api/routes` | Routes |
| GET | `/api/reports/summary` | MongoDB aggregation summary |
| GET/PATCH/DELETE | `/api/notifications` | Notifications |

## Socket.IO Events

**Client → Server**

- `track:subscribe` — join `track:{deliveryId}` room

**Server → Client**

- `delivery:created`, `delivery:updated`, `delivery:statusChanged`
- `driver:locationUpdated`, `vehicle:locationUpdated` (payload includes `id`, `driverId`, `vehicleId`)
- `notification:new`

## Docker

```bash
docker build -t gurunanak-logistics .
docker run -p 5000:5000 \
  -e JWT_SECRET=your-secret \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/gnk \
  gurunanak-logistics
```

Health check: `GET /api/health` (configured in Dockerfile `HEALTHCHECK`).

## Testing

```bash
# Frontend
npm run lint
npm run build

# Backend (requires MongoDB on localhost:27017 or set MONGODB_URI)
cd server && npm test
```

## Load Testing

Requires [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/):

```bash
BASE_URL=http://localhost:5000 k6 run performance/load-test.js
# Optional authenticated endpoints:
AUTH_TOKEN=<jwt> BASE_URL=http://localhost:5000 k6 run performance/load-test.js
```

Do not interpret results unless you run the script yourself.

## Deployment

### Vercel (Frontend)

Build: `npm run build` · Output: `dist` · Set `VITE_API_URL` to backend URL.

### Render (Backend)

Bind to `0.0.0.0:$PORT` · Set `JWT_SECRET`, `MONGODB_URI`, `CORS_ORIGIN`.

## Limitations

- GPS tracking uses a **simulator**, not real telematics (see `server/services/gpsAdapter.js`)
- Proof photos without Cloudinary store data URLs locally/demo mode
- Password reset emails require `EMAIL_PROVIDER`; dev mode may return reset token only in development
- Dispatcher cannot manage fleet, drivers, customers, or settings (by design)

## Future Scope

- Real GPS/telematics adapter implementation
- Email provider integration for password reset
- Cloudinary-backed media storage
- Expanded frontend test suite

## License

Proprietary — GURUNANAK Transportation & Logistics
