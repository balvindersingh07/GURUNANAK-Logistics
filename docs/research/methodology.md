# Methodology

## GURUNANAK Transportation & Logistics

**Research question:** *How can modern full stack architectures ensure scalability, modularity, and maintainability?*

---

## 1. Research Approach

This study adopts an **applied design-and-evaluation methodology** aligned with software architecture practice: architectural requirements are derived from a transportation and logistics domain; a full-stack reference implementation is constructed as an evidence base; and quality attributes are verified through automated testing and controlled load measurement rather than asserted from design intent alone [4][9][13]. The approach is **descriptive and evaluative**, not experimental in the clinical sense: the GURUNANAK platform serves as a bounded case study through which literature on layered architecture, RESTful services, modular structure, containerization, security boundaries, and performance analysis is operationalized in code [3][4][12].

The methodology deliberately separates **what was built and measured** from **what literature or deployment guides propose for future production environments**. Implementation follows a modular monolith pattern packaged for container deployment; microservice decomposition is discussed in related literature but is **not** claimed for this project [2][10]. Continuous Integration (CI) is implemented and verified in GitHub Actions; **Continuous Deployment (CD) to a public cloud is not verified** in the repository. Performance evidence is limited to a documented local k6 run under light authenticated concurrency. Throughout, findings are reported with explicit scope so that scalability, modularity, and maintainability claims remain traceable to repository artefacts and recorded test outputs.

---

## 2. System and Domain Selection: Transportation & Logistics

Transportation and logistics was selected because it combines **multi-role workflows**, **stateful business entities** (deliveries, drivers, fleet, routes), and **time-sensitive visibility** (tracking, notifications, operational dashboards)—properties that stress architectural separation, authorization, and real-time integration in ways a trivial CRUD demo would not [4]. The domain requires distinct capabilities for administrators, dispatchers, drivers, and customers, each with different read/write scope, which motivates role-based access control and ownership checks at the API and socket layers.

The GURUNANAK system was scoped as an enterprise-style logistics management platform: delivery lifecycle management, fleet and driver administration, customer-linked shipments, route planning, reporting aggregates, proof-of-delivery capture, and live map-oriented tracking views. Domain complexity justifies a **full-stack** rather than frontend-only prototype, while an **offline/demo fallback** preserves usability when MongoDB or the API is unavailable—supporting development, demonstration, and resilience testing without conflating demo behaviour with production telematics or cloud-hosted operations.

---

## 3. Functional Requirements

Functional requirements were elicited from the domain and encoded in route modules, React pages, and automated tests. **Authentication and identity** include login, registration, password reset flows, and role-specific dashboards. **Delivery management** covers create/read/update/delete, paginated listing, strict status transitions, driver assignment, and proof-of-delivery submission. **Fleet and workforce management** includes vehicles, drivers, customers, and routes with admin-gated write operations where specified. **Operations and visibility** include live tracking pages, notification APIs, and MongoDB aggregation summaries for reports.

**Authorization requirements** restrict customers to their own deliveries, drivers to assigned deliveries, dispatchers to operational modules (without full admin settings/fleet CRUD where designed), and administrators to full CRUD. **Non-functional requirements** embedded in the implementation include JWT-authenticated REST access, input validation at API boundaries, rate limiting, CORS configuration, Docker-packaged deployment, CI verification on push/pull request, and empirical API load measurement. Requirements are **implemented and test-backed** in the repository; they should not be read as certification of production-scale SLA, real GPS telematics, or verified cloud deployment.

---

## 4. System Architecture

The system follows a **layered full-stack architecture** with four primary responsibilities: React presentation, Express application services, REST and Socket.IO integration, and MongoDB persistence via Mongoose [3][4]. The frontend communicates with the backend through a service layer (`src/services/*`) that wraps HTTP calls; the backend organizes routes, controllers, models, middleware, and utilities in separate modules within a **single deployable Node.js process**—a modular monolith, not an independently deployed microservice mesh [2][10].

```
┌─────────────────┐     JWT + REST      ┌──────────────────┐     Mongoose     ┌──────────┐
│  React (Vite)   │ ◄──────────────────► │  Express API     │ ◄──────────────► │ MongoDB  │
│  Service layer  │     Socket.IO        │  RBAC + Zod      │                  └──────────┘
└────────┬────────┘                      └──────────────────┘
         │
         ▼ (API unavailable)
┌─────────────────┐
│ AppContext +    │
│ localStorage    │  ← Demo fallback
└─────────────────┘
```

Environment configuration externalizes secrets and connection strings (`JWT_SECRET`, `MONGODB_URI`, `CORS_ORIGIN`, `VITE_API_URL`, `VITE_SOCKET_URL`), consistent with cloud-ready and twelve-factor configuration guidance [5][7]. The multi-stage Dockerfile builds the Vite frontend, copies static assets into the server image, exposes port 5000, and defines a `HEALTHCHECK` against `/api/health` [7]. **Proposed** deployment targets (e.g., Vercel for frontend, Render for backend) appear in project documentation but are **not verified as live production deployments** in this research artefact.

---

## 5. Frontend Architecture

The frontend is implemented with **React 19**, **TypeScript**, and **Vite**, using **Tailwind CSS** and component libraries (Lucide React, Recharts, Leaflet) for operational UI. **React Router** provides client-side routing with **lazy-loaded** page components (`React.lazy` + `Suspense`) to reduce initial bundle size and align maintainability with modular route boundaries. Routes are grouped by role through `RoleGuard` and `RoutePermissionGuard`, separating navigation policy from page content.

**Context-based state management** is implemented through `AuthContext` (session, JWT token in `gnk_token`, demo user storage in `gnk_auth`) and `AppContext` (domain entities, loading/error state, `apiOnline` flag). When `checkApiHealth()` confirms `status: ok` and `mongo: true`, `AppContext` loads data via REST service modules; when the API is unavailable, the same context operations mutate **local state** and persist to `gnk_app_data` in `localStorage`. **REST API integration** is centralized in `apiRequest()` with bearer token injection and 401 handling. **Socket.IO integration** is provided by `useSocket`, which connects with JWT in `handshake.auth`, listens for `delivery:updated`, location, and notification events, and exposes `track:subscribe` for delivery rooms—complementing REST for live updates as recommended when request-response alone is insufficient [3][4].

---

## 6. Backend Architecture

The backend uses **Node.js** and **Express**, mounted on an HTTP server shared with **Socket.IO**. **REST APIs** are namespaced under `/api` for auth, deliveries, drivers, vehicles, customers, routes, reports, and notifications. A health endpoint (`GET /api/health`) reports service status and MongoDB connectivity. **Middleware** includes CORS, JSON body parsing (2 MB limit), global API rate limiting, stricter auth rate limiting, JWT `auth` middleware, `roleCheck` RBAC, `validate` for Zod parsing, `enrichUser` for linked customer/driver IDs, and centralized `errorHandler`.

**Zod validation** is applied at route boundaries through the `validate(schema)` middleware, parsing and replacing `req.body` (or query) before controllers execute—implementing literature’s principle of validation at trust boundaries [4]. **JWT authentication** verifies bearer tokens on protected routes using `jsonwebtoken` and a server-side secret [6]. **RBAC** restricts endpoints by role (admin, dispatcher, driver, customer) via composable `roleCheck(...roles)` middleware. Controllers remain thin orchestrators over Mongoose models and utilities such as `buildDeliveryFilter`, `assertDeliveryAccess`, and `parsePagination`. The backend is a **single process**; internal modularity supports maintainability without claiming microservice independence [2][10].

---

## 7. Database Design and Access

**MongoDB** serves as the document store, accessed through **Mongoose** schemas and models. Implemented models include **User**, **Delivery**, **Driver**, **Vehicle**, **Customer**, **Route**, **Notification**, and **ProofOfDelivery**, each defining field constraints, enums, references, and timestamps where applicable. **Indexes** support query patterns used in list, filter, and report operations—for example, Delivery indexes on `status`, `driverId`, `customerId`, `vehicleId`, and `createdAt`; Driver on `email` and `status`; Customer on `email`, `phone`, and `name`; Notification on `userId`/`read` and `createdAt`—aligning with literature on indexing for scalable collection access [4][11].

**Pagination** is implemented server-side via `parsePagination(query, defaultLimit = 20, maxLimit = 100)` and `paginatedResponse()`, returning `{ data, page, limit, total, totalPages }` for list endpoints on deliveries, drivers, vehicles, customers, routes, and notifications. Role-aware filters (e.g., customers see only their deliveries) are applied in `buildDeliveryFilter` before paginated queries. Seed data (`seedIfEmpty`) initializes an empty database for development and testing. Connection is configured through `MONGODB_URI`, supporting local MongoDB or Atlas-style external hosting without embedding the database inside the application container in production-oriented configurations [11].

---

## 8. Real-Time Communication Methodology

Real-time behaviour uses **Socket.IO** on the same origin as the Express server, with CORS aligned to `CORS_ORIGIN`. **Authenticated socket connection** is enforced by middleware that verifies JWT from `socket.handshake.auth.token`, resolves linked `customerId`/`driverId`, and attaches `socket.user` before any event handlers run—mirroring stateless JWT verification on REST [6]. Clients subscribe to tracking rooms via `track:subscribe`; the server validates delivery existence and **ownership/access** through `assertDeliveryAccess` before joining `delivery:{id}` and `track:{trackingId}` rooms.

**Delivery tracking updates** are emitted as `delivery:updated`, `delivery:statusChanged`, `driver:locationUpdated`, `vehicle:locationUpdated`, and `notification:new`. Location progression for active shipments is produced by `startTrackingSimulator`, which runs on a **30-second interval** and uses a `gpsAdapter` abstraction. **IMPORTANT:** GPS in this project is **SIMULATED**, not real vehicle telematics. The simulator interpolates movement for deliveries in active statuses; `gpsAdapter.js` exists as a replaceable hook for future real GPS integration but **no real telematics provider is integrated or verified**. Socket behaviour was exercised in local QA (documented as simulated GPS in `qa-playwright/results.json`); this does not constitute field validation of live fleet hardware.

---

## 9. Security Methodology

Security controls were designed as **cross-cutting architectural mechanisms** rather than page-level checks alone [4][6]. **JWT** tokens are issued at login and validated on each protected REST request and Socket.IO connection [6]. Passwords are hashed with **bcrypt** (`bcryptjs`) before storage; plaintext passwords are not returned from APIs. **RBAC** maps roles to permitted route operations on both frontend guards and backend middleware. **Zod validation** rejects malformed payloads at boundaries; delivery **status transitions** are validated against allowed state machines in both backend utilities and frontend helpers.

**Rate limiting** applies separately to auth routes (default 100 requests per 15 minutes in production) and general API routes (default 300 requests per minute in production), with higher development/test limits to support QA bursts. **CORS** restricts browser origins via configurable `CORS_ORIGIN`. **Ownership and access controls** include `assertDeliveryAccess` and query filters that prevent customers and drivers from reading or subscribing to unrelated deliveries (IDOR mitigation). Automated **security and RBAC test suites** (`security.test.js`, `rbac.test.js`) exercise proof-of-delivery rules, socket authorization, and role boundaries. These measures demonstrate **implemented defensive design**; they do not imply formal penetration testing, compliance certification, or production security audit completion.

---

## 10. DevOps Methodology

DevOps activity in this project focuses on **reproducible build verification and container packaging**, not verified automated release to cloud production [7][8][12]. **Docker** uses a multi-stage build: frontend `npm ci` + Vite build, server dependency install, combined runtime image serving static `public` assets and the Express API on `0.0.0.0:5000` with health checking. **GitHub Actions CI** (`.github/workflows/ci.yml`) runs three jobs on push/pull request to `main`/`master`: frontend `npm ci`, **Oxlint** linting, and production build; backend `npm ci` and **Jest** tests against a MongoDB 7 service container; and **Docker build** verification.

**Linting** uses Oxlint via `npm run lint` (invoked directly through Node on Windows-compatible paths). **Automated backend tests** comprise four Jest suites (`auth.test.js`, `deliveries.test.js`, `rbac.test.js`, `security.test.js`) executed with Supertest against the application instance—**51 tests, all passing** in the latest local verification. **E2E testing** uses Playwright scripts in `qa-playwright/` (`run-qa.mjs` and targeted regression scripts) against a live Vite frontend and Express backend; the archived `results.json` records **105 of 109** scenarios passed (98.1%) in one documented local run with MongoDB connected. CI implements **integration automation** [12]; **CD pipelines to Render, Vercel, or other hosts are documented as proposals only** and were not verified as part of this methodology.

---

## 11. Performance Evaluation Methodology

Performance evaluation follows controlled workload principles: define concurrency, duration, endpoints, authentication context, and success criteria; execute repeatable scripts; report latency distributions and failure rates rather than single-point anecdotes [9][13]. The project uses **Grafana k6** (`performance/load-test.js`) against a locally running API. Each virtual user iteration performs: `GET /api/health` (with JSON checks), `GET /api/deliveries?page=1&limit=20`, and `GET /api/reports/summary`, with bearer token supplied via `AUTH_TOKEN` for authenticated endpoints. Script options fix **5 virtual users (VUs)** for **30 seconds**, with an HTTP failure-rate threshold below 10%.

**Verified authenticated local run (documented evidence):**

| Metric | Value |
|--------|-------|
| Virtual users | 5 |
| Duration | 30 seconds |
| Iterations | 75 |
| HTTP requests | 225 |
| Checks | 300/300 passed |
| HTTP request failure rate | 0.00% |
| Average response time | 16.3 ms |
| p90 latency | 30.22 ms |
| p95 latency | 53.71 ms |
| Throughput | 7.28 requests/sec |
| Threshold | Passed |
| Exit code | 0 |

This result demonstrates stable behaviour under **light concurrent authenticated load on localhost**. It is **not** a maximum-capacity benchmark, **not** cloud-hosted performance, and **not** proof of production scalability. Percentile reporting (p90, p95) follows performance-analysis guidance that tail latency matters for user experience [9][13]. Architectural tactics exercised during the test include pagination, indexed queries, JWT middleware, and rate limiting—whose combined effect under higher load or remote deployment would require separate measurement campaigns.

---

## 12. Offline and Demo Fallback Architecture

To support demonstration without a running backend, the frontend implements a **dual-mode architecture** controlled by the `apiOnline` flag in `AppContext`. On startup, `checkApiHealth()` requests `/api/health` and requires both `status: ok` and `mongo: true` before enabling full-stack mode. If the check fails or network errors occur, the application operates in **demo mode**: auth may use demo users stored in `gnk_auth`/`gnk_users` localStorage; domain data is read from and written to `gnk_app_data`; mutations execute through local helper functions mirroring API semantics (including delivery status progression and map coordinates from predefined city coordinates).

Demo mode is a **methodological affordance** for usability and frontend-only development; it is not a substitute for distributed consistency, multi-user concurrency, or server-side authorization. When the API becomes available, the same React components consume REST and Socket.IO paths without structural UI changes—illustrating modular separation between presentation and integration. Literature on layered architecture supports such substitution at the service boundary provided contracts remain stable [3][4]; the fallback is an **implementation-specific extension** beyond standard academic prescriptions.

---

## 13. Testing Methodology

Testing is **multi-layered** to align with continuous integration practice [12]. **Unit and integration tests (backend):** Jest with Supertest against Express routes and MongoDB test database helpers; covers authentication, delivery CRUD and transitions, RBAC denials, proof-of-delivery partial updates, socket authorization, and security regressions—**51 passing tests** in four suites. **Static analysis:** Oxlint on frontend source. **Build verification:** TypeScript project references and Vite production build in CI and locally. **End-to-end (E2E) tests:** Playwright-driven browser automation in `qa-playwright/`, executed against running frontend (port 5173) and backend (port 5000) with MongoDB; includes full regression (`run-qa.mjs`) and targeted scripts for auth regression, demo login, delivery creation, and driver routing.

E2E methodology documents rate-limit configuration for dev/test to reduce false failures from HTTP 429 during burst scenarios. Results are persisted to JSON artefacts (`results.json`) with pass/fail/block counts and defect notes. **Performance tests:** k6 load script as described in Section 11. Testing validates **implemented behaviour under documented conditions**; it does not certify infinite scale, geographic distribution, or production monitoring coverage.

---

## 14. Limitations of the Methodology

Several limitations bound the generalizability of conclusions. **Scope of deployment evidence:** Docker and CI are verified; **public cloud production deployment is not verified**, so elasticity, multi-region behaviour, and provider-specific cost/performance remain out of scope [1]. **Architecture scope:** the system is a **modular monolith**, not microservices; findings about internal modularity do not transfer directly to distributed operational complexity [2][10]. **GPS and telematics:** all live tracking data in full-stack mode originates from a **simulator**; conclusions about real-time logistics cannot be extended to actual fleet hardware or third-party telematics APIs.

**Performance measurement:** the k6 run used **five virtual users for thirty seconds on localhost** with a pre-issued JWT—adequate as a **light-concurrency sanity baseline**, inadequate for capacity planning or SLA definition [9][13]. Rate limits, single-machine MongoDB, and absence of CDN/edge caching further constrain throughput interpretation. **E2E results** reflect one local Chromium run (105/109 passed in archived results) and may vary with timing, rate limits, and environment. **Security evaluation** is developer-test-based, not third-party audit. **CD automation** is not implemented or verified; only CI and container build success are evidenced [8][12]. Future work—cloud deployment, real GPS adapters, expanded load profiles, and optional service decomposition—would extend but not replace the methodology documented here.

---

## References

The following sources support methodological framing and are numbered consistently with `docs/research/literature-review.md`:

[1] Mell, P., & Grance, T. (2011). *The NIST definition of cloud computing* (NIST Special Publication 800-145). National Institute of Standards and Technology. https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf

[2] Lewis, J., & Fowler, M. (2014). *Microservices*. Martin Fowler. https://martinfowler.com/articles/microservices.html

[3] Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* (Doctoral dissertation, University of California, Irvine). https://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm

[4] Bass, L., Clements, P., & Kazman, R. (2012). *Software architecture in practice* (3rd ed.). Addison-Wesley Professional. https://www.sei.cmu.edu/library/software-architecture-in-practice-third-edition/

[5] Wiggins, A. (2012). *The twelve-factor app*. https://12factor.net/

[6] Jones, M., Bradley, J., & Sakimura, N. (2015). *RFC 7519: JSON Web Token (JWT)*. Internet Engineering Task Force. https://www.rfc-editor.org/rfc/rfc7519

[7] Docker Inc. (n.d.). *Docker overview*. https://docs.docker.com/get-started/docker-overview/

[8] GitHub. (n.d.). *GitHub Actions documentation*. https://docs.github.com/en/actions

[9] Grafana Labs. (n.d.). *Grafana k6 documentation*. https://grafana.com/docs/k6/latest/

[10] Newman, S. (2021). *Building microservices: Designing fine-grained systems* (2nd ed.). O'Reilly Media. https://www.oreilly.com/library/view/building-microservices-2nd/9781492034015/

[11] MongoDB Inc. (n.d.). *MongoDB documentation*. https://www.mongodb.com/docs/

[12] Humble, J., & Farley, D. (2010). *Continuous delivery: Reliable software releases through build, test, and deployment automation*. Addison-Wesley Professional. https://www.oreilly.com/library/view/continuous-delivery-reliable/9780321601919/

[13] Jain, R. (1991). *The art of computer systems performance analysis: Techniques for experimental design, measurement, simulation, and modeling*. Wiley. https://www.wiley.com/en-us/The+Art+of+Computer+Systems+Performance+Analysis-p-9780471503361

---

*Prepared for the GURUNANAK Transportation & Logistics research paper. Application codebase unchanged (CODE FROZEN).*
