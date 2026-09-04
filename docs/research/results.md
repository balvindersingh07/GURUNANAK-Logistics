# Results

## GURUNANAK Transportation & Logistics

**Research question:** *How can modern full stack architectures ensure scalability, modularity, and maintainability?*

This section reports **measured and archived outcomes** from automated tests, load scripts, and documented QA artefacts. Results are grouped into functional behaviour, security controls, testing coverage, performance measurement, architectural mechanisms, and CI/DevOps verification. Throughout, **measured results** are distinguished from **implemented but unbenchmarked capabilities** and from **future or unverified deployment scenarios**.

---

## 1. Functional Results

The implemented platform supports four user roles—**administrator**, **dispatcher**, **driver**, and **customer**—each with role-specific dashboards and route access enforced on both frontend guards and backend middleware. Archived browser QA (`qa-playwright/results.json`) recorded successful login redirects for all four demo accounts, role-appropriate navigation, and operational page loads for deliveries, fleet, drivers, customers, routes, reports, notifications, and settings where permitted by design. Backend integration tests independently confirm that administrators and dispatchers can list operational resources while drivers and customers receive HTTP 403 on unauthorized collection endpoints.

**Delivery management** was verified through REST CRUD, paginated listing (`page`, `limit`), status filtering, and strict workflow transitions. The archived E2E run passed create-delivery validation, successful creation with redirect to delivery details, and persistence after page refresh. **Fleet, driver, customer, and route management** pages loaded and rendered list data in the archived QA session (e.g., fleet list count recorded as 20 entries). **Delivery workflow** transitions (`pending` through `delivered` and `cancelled`) are enforced in backend tests and mirrored on the frontend. **Proof of Delivery (POD)** supports photo and signature capture; backend tests verify partial POD updates preserve existing fields across separate requests, and the archived E2E run passed photo/signature visibility and a negative test blocking delivery completion without POD—while the full POD flow scenario was **blocked** in that run due to API preparation failure (see Section 3).

**Notifications** and **reports** are exposed via REST APIs; the reports summary endpoint participated in the verified k6 workload. **Live tracking** renders Leaflet maps with markers and route visualization; the archived QA explicitly recorded GPS source as **SIMULATED GPS (`trackingSimulator`)**, with a 35-second simulator wait completing without crash on the Live Tracking page. **No real telematics or vehicle GPS hardware was used or measured.** When MongoDB or the API is unavailable, the frontend operates in demo mode via `AppContext` and `localStorage`; that fallback supports demonstration but is not reported here as production-equivalent behaviour.

---

## 2. Security Results

Security controls were evaluated primarily through **automated backend suites** and **archived browser security scenarios**, not through third-party penetration testing. **JWT authentication** is verified by login tests returning bearer tokens, `/api/auth/me` returning the authenticated user, and protected routes returning HTTP 401 without a valid token. Tokens are validated on REST requests and Socket.IO connections [6]. **bcrypt password hashing** is implemented server-side (`bcryptjs`); passwords are not returned in API responses, and successful login against seeded demo credentials confirms the credential path functions without storing plaintext secrets.

**Role-based access control (RBAC)** tests document expected allow/deny outcomes: administrators and dispatchers may list drivers; drivers and customers receive HTTP 403 on driver listing; role-specific write restrictions are enforced on delivery and fleet operations. **Zod validation** at API boundaries returns HTTP 400 with structured `Validation failed` details for invalid email format, short passwords, and missing credentials—confirming rejection before business logic executes [4]. **Rate limiting** is configured with separate auth and API limiters (production defaults: 100 auth requests per 15 minutes, 300 API requests per minute); limiters are implemented and documented but were not exhaustively benchmarked under sustained attack simulation.

**CORS** is enforced via configurable `CORS_ORIGIN` on Express and Socket.IO. **Ownership and access controls** prevent customers and drivers from accessing unrelated deliveries through query filters (`buildDeliveryFilter`) and `assertDeliveryAccess`; security tests cover IDOR-style denial and Socket.IO room authorization. **Password reset security** tests confirm that `POST /api/auth/forgot-password` returns a **generic message** for both unknown and known emails and does **not** expose a reset token in the response body—mitigating account enumeration in the tested path. These results demonstrate **implemented defensive behaviour under test conditions**; they do not constitute formal security certification.

---

## 3. Testing Results

Testing produced **three categories of evidence**: backend Jest/Supertest integration results, archived Playwright E2E results, and targeted regression scripts. The following table summarizes **measured** test outcomes:

| Layer | Artefact | Measured outcome |
|-------|----------|------------------|
| Backend integration | Jest (4 suites) | **51/51 tests passing** |
| Browser E2E | `qa-playwright/results.json` | **105/109 passed** (98.1%); 2 failed; 2 blocked |
| Performance | k6 authenticated local run | 300/300 checks; 0.00% HTTP failure (Section 4) |

**Jest backend results (51/51 passing):** Four suites—`auth.test.js`, `deliveries.test.js`, `rbac.test.js`, and `security.test.js`—cover health checks, login validation, delivery CRUD and transitions, RBAC denials, proof-of-delivery rules, and socket authorization. These tests run against MongoDB with Supertest and represent the strongest **repeatable pass rate** in the evidence base.

**Playwright E2E results (105/109 — not 100%):** The archived full regression run used Chromium headless against `http://localhost:5173` with MongoDB connected (`mongo: true`, `apiStatus: ok`). **105 scenarios passed**, **2 failed**, and **2 were blocked**:

| Outcome | Test | Notes |
|---------|------|-------|
| FAIL | Unauthenticated `/dashboard` | Expected redirect to login; actual navigation to customer dashboard (QA-1, P2) |
| FAIL | Invalid JWT logout behaviour | Expected redirect or clear session; actual customer dashboard retained (QA-2, P2) |
| BLOCKED | Pagination next | No next button (single page or hidden) |
| BLOCKED | Full POD flow | `no podTestDeliveryId` — API prep failed |

The archived suite therefore **does not demonstrate 100% E2E success**. Failures are documented security-route edge cases in that run; a separate **auth regression script** (`test-auth-regression.mjs`) was added subsequently to validate invalid-JWT guard behaviour in isolation. **P1 regression** (create delivery): the archived run passed *Create delivery*, *Create persistence*, and related validation scenarios; a dedicated `test-create-delivery.mjs` script exists for focused verification. **P2 regression** (driver `/driver/delivery/:id` routing): a dedicated `test-driver-delivery-route.mjs` script exists; the archived full suite logged P2-class security defects separately from driver-route navigation tests.

**Distinction:** Backend tests show **complete pass** on scoped API behaviour; archived E2E shows **high but incomplete pass** with explicit failed and blocked cases. Targeted regression scripts provide additional evidence for fixes but are not merged into the 105/109 aggregate unless re-run into a new archived `results.json`.

---

## 4. Performance Results

Performance was measured with **Grafana k6** (`performance/load-test.js`) against a **locally running** Express API using a **valid authenticated JWT** supplied via the `AUTH_TOKEN` environment variable. Each virtual-user iteration executed three HTTP requests with checks: `GET /api/health`, `GET /api/deliveries?page=1&limit=20`, and `GET /api/reports/summary`.

**Verified k6 run — measured results:**

| Metric | Value |
|--------|-------|
| Load profile | 5 VUs |
| Duration | 30 seconds |
| Iterations | 75 |
| HTTP requests | 225 |
| Checks | **300 passed / 0 failed** |
| HTTP request failure rate | **0.00%** |
| Average response time | **16.3 ms** |
| p90 latency | **30.22 ms** |
| p95 latency | **53.71 ms** |
| Throughput | **7.28 requests/sec** |
| Threshold (`http_req_failed < 0.1`) | **PASSED** |
| k6 exit code | **0** |

Under this profile, all scripted checks passed and no HTTP requests failed. Latency percentiles indicate stable tail behaviour at light concurrency on localhost [9][13].

**This result represents a local light-concurrency workload and should not be interpreted as a maximum-capacity or production benchmark.** It was not executed against a cloud-hosted deployment, does not measure WebSocket throughput, and does not establish SLA, saturation point, or horizontal scaling capacity. Production rate limits, geographic latency, and shared infrastructure effects were not measured.

---

## 5. Scalability and Architecture Results

Several **architectural mechanisms are implemented and partially exercised** by the tests above, but **horizontal scaling has not been benchmarked** and no multi-instance load test was performed [4][9].

| Mechanism | Status | Evidence type |
|-----------|--------|---------------|
| Server-side pagination | Implemented | API controllers; k6 hit paginated deliveries |
| MongoDB indexes | Implemented | Schema indexes on status, foreign keys, dates |
| Stateless JWT API | Implemented | Per-request auth; k6 used bearer token |
| Lazy-loaded frontend routes | Implemented | `React.lazy` in `App.tsx` |
| Docker packaging | Implemented | Multi-stage Dockerfile; CI build job |
| Socket.IO rooms | Implemented | `track:subscribe` joins delivery rooms; QA noted simulated GPS |
| Rate limiting | Implemented | Auth and API limiters; not load-saturated |
| Modular separation | Implemented | Route modules, services, models, middleware |

Pagination and indexes align with literature on controlling payload size and query cost [4][11]. Stateless JWT design supports theoretical horizontal scaling of API instances [3][6], but **no test replicated multiple backend replicas or measured load-balancer behaviour**. Socket.IO room isolation was implemented and used in QA with **simulated** location events only. These entries describe **implemented capabilities**, not **measured scale-out performance**.

---

## 6. CI and DevOps Results

The repository defines a **GitHub Actions CI workflow** (`.github/workflows/ci.yml`) triggered on push and pull request to `main`/`master`. Three jobs are configured:

| Job | Steps | Purpose |
|-----|-------|---------|
| **frontend** | `npm ci`, `npm run lint`, `npm run build` | Static analysis and production build verification |
| **backend** | `npm ci`, `npm test` with MongoDB 7 service | **51** Jest tests in CI environment |
| **docker** | `docker build -t gurunanak-logistics:ci .` | Container image build verification |

The Dockerfile defines a **HEALTHCHECK** against `GET /api/health`, supporting container orchestration readiness probes [7]. The health endpoint returns `status: ok` and a boolean `mongo` connectivity flag, verified in Jest and k6 checks.

**Measured CI outcome in this research context:** workflow definition and local test/build success are documented; **automatic Continuous Deployment (CD) to a cloud provider is not implemented or verified** [8][12]. README deployment notes (e.g., Vercel, Render) describe **proposed** targets only. No verified public production URL or cloud performance measurement is included in these results.

---

## 7. Overall Findings

**What measured results demonstrate:** The GURUNANAK platform implements a functional multi-role logistics application with REST and Socket.IO integration, simulated live tracking, and a broad automated test surface. Backend integration tests achieve **100% pass (51/51)** on scoped API, RBAC, delivery, and security scenarios. Archived browser QA achieves **96.3% executable pass (105/109)** with documented failures and blocked cases—not full E2E coverage. The authenticated local k6 run shows **zero HTTP failures** and sub-54 ms p95 latency under **five concurrent virtual users for thirty seconds**, satisfying the scripted threshold on three representative endpoints.

**What remains unmeasured or unverified:** Maximum system capacity, cloud-hosted performance, real GPS/telematics accuracy, horizontal scaling under load balancers, production security audit, and verified cloud deployment were **not measured**. Continuous Deployment pipelines, multi-region elasticity, and cost-performance at scale remain **future evaluation** items [1][9]. Architectural mechanisms (pagination, indexes, JWT statelessness, Docker, modular code structure) are **implemented** and partially touched by tests but should not be extrapolated to production SLA without further measurement campaigns.

In summary, the evidence supports claims of **functional completeness**, **security control implementation**, **strong backend test pass rates**, **high but incomplete E2E pass rates**, and a **light local performance baseline**—while explicitly **not** supporting claims of production cloud performance, maximum throughput, real GPS validation, automatic CD, or benchmarked horizontal scaling.

---

## References

[1] Mell, P., & Grance, T. (2011). *The NIST definition of cloud computing* (NIST Special Publication 800-145). National Institute of Standards and Technology. https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf

[3] Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* (Doctoral dissertation, University of California, Irvine). https://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm

[4] Bass, L., Clements, P., & Kazman, R. (2012). *Software architecture in practice* (3rd ed.). Addison-Wesley Professional. https://www.sei.cmu.edu/library/software-architecture-in-practice-third-edition/

[6] Jones, M., Bradley, J., & Sakimura, N. (2015). *RFC 7519: JSON Web Token (JWT)*. Internet Engineering Task Force. https://www.rfc-editor.org/rfc/rfc7519

[7] Docker Inc. (n.d.). *Docker overview*. https://docs.docker.com/get-started/docker-overview/

[8] GitHub. (n.d.). *GitHub Actions documentation*. https://docs.github.com/en/actions

[9] Grafana Labs. (n.d.). *Grafana k6 documentation*. https://grafana.com/docs/k6/latest/

[11] MongoDB Inc. (n.d.). *MongoDB documentation*. https://www.mongodb.com/docs/

[12] Humble, J., & Farley, D. (2010). *Continuous delivery: Reliable software releases through build, test, and deployment automation*. Addison-Wesley Professional. https://www.oreilly.com/library/view/continuous-delivery-reliable/9780321601919/

[13] Jain, R. (1991). *The art of computer systems performance analysis: Techniques for experimental design, measurement, simulation, and modeling*. Wiley. https://www.wiley.com/en-us/The+Art+of+Computer+Systems+Performance+Analysis-p-9780471503361

---

*Prepared for the GURUNANAK Transportation & Logistics research paper. Application codebase unchanged (CODE FROZEN).*
