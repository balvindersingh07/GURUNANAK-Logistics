# Design and Evaluation of a Scalable, Modular Full-Stack Transportation and Logistics Management System

---

## Title Page

**Title:** Design and Evaluation of a Scalable, Modular Full-Stack Transportation and Logistics Management System

**Project:** GURUNANAK Transportation & Logistics

**Tagline:** Moving Every Delivery Forward

**Research question:** *How can modern full stack architectures ensure scalability, modularity, and maintainability?*

**Document status:** CODE FROZEN — research paper assembled from verified repository artefacts. **No verified public cloud production deployment** at the time of writing.

**Repository:** https://github.com/balvindersingh07/GURUNANAK-Logistics

---

## Abstract

Transportation and logistics operations depend on software systems that coordinate multi-role workflows, persist complex domain entities, and expose timely visibility into delivery status. Such systems must remain evolvable as business rules change, yet many implementations accumulate coupling that undermines scalability and long-term maintainability. This paper presents the design, implementation, and evaluation of **GURUNANAK Transportation & Logistics**, a full-stack platform addressing these concerns through layered architecture, a modular monolith, REST and Socket.IO integration, JWT/RBAC security, containerization, and automated verification.

The **objective** is to investigate how modern full-stack architectural practices—separation of presentation, application, persistence, and integration layers; stateless API design; modular internal structure; DevOps automation; and empirical performance measurement—support scalability, modularity, and maintainability in a logistics domain. The system implements a React (Vite/TypeScript) frontend, Node.js/Express backend, MongoDB/Mongoose persistence, Docker packaging, and GitHub Actions CI. Real-time tracking uses **simulated GPS** via a server-side tracking simulator; **real telematics is not integrated**. Live tracking, proof-of-delivery capture, notifications, and reporting are implemented and partially verified through automated tests.

**Evaluation** combined backend integration testing (Jest/Supertest), archived browser end-to-end regression (Playwright), and authenticated local load testing (Grafana k6). Measured outcomes include **51/51 passing backend tests**, an archived **105/109 Playwright scenarios passed** (not 100%), and a verified k6 run under five virtual users for thirty seconds yielding **225 HTTP requests**, **0.00% HTTP request failure rate**, **16.3 ms average response time**, **53.71 ms p95 latency**, and **300/300 checks passed**. This performance evidence reflects a **local light-concurrency workload** and must not be interpreted as maximum capacity, production performance, or cloud-hosted measurement.

**Limitations** include simulated GPS, absence of verified cloud deployment, absence of verified Continuous Deployment (CD), no horizontal scaling benchmark, and qualitative—not actual—cloud cost analysis. **Contribution:** a documented, test-backed case study demonstrating how disciplined full-stack architecture, security at boundaries, CI automation, and pilot load measurement jointly address the research question while explicitly distinguishing implemented mechanisms, measured results, and unevaluated production-scale claims.

---

## Keywords

Full-stack architecture; transportation and logistics; modular monolith; REST API; Socket.IO; JWT; role-based access control; MongoDB; Docker; continuous integration; load testing; k6; scalability; maintainability; simulated GPS

---

## 1. Introduction

Transportation and logistics software must orchestrate shipments, fleet assets, drivers, customers, and operational reporting across organizational boundaries. Legacy or ad hoc systems often entangle user interface logic with persistence and authorization, producing systems that are difficult to extend when new roles, workflows, or compliance rules emerge. Concurrently, operational dashboards and customer-facing tracking interfaces require architectures that separate concerns while supporting both request-response APIs and live updates. The **problem** addressed in this paper is therefore not merely building a logistics application, but **designing and evaluating** a full-stack architecture that embeds scalability tactics, modular structure, and maintainability practices from the outset.

Modern full-stack development offers mature patterns—layered client-server design, stateless REST services, document databases, container packaging, and automated CI—that literature associates with evolvable enterprise systems [3][4]. Yet architectural intent alone does not guarantee quality attributes; empirical testing and explicit scope boundaries are required to distinguish **implemented design**, **measured behaviour**, and **unverified deployment aspirations** [9][13]. The **motivation** for GURUNANAK Transportation & Logistics is to instantiate these principles in a realistic multi-role logistics platform and to report verified evidence rather than unsupported production claims.

The **research question** guiding this work is: *How can modern full stack architectures ensure scalability, modularity, and maintainability?* **Objectives** include: (1) designing a layered modular monolith for transportation and logistics; (2) implementing security and scalability mechanisms aligned with literature; (3) verifying behaviour through automated backend, E2E, and load tests; and (4) interpreting results against architectural and cloud-deployment trade-offs. **Contributions** include a CODE FROZEN reference implementation, research documentation (literature review, methodology, results, discussion), verified test and k6 artefacts, Docker/CI pipelines, and explicit labelling of simulated GPS, unverified cloud deployment, and non-maximum performance benchmarks. Deployment guidance in the README (e.g., Vercel, Render) is **architecturally proposed**, not verified in this study.

---

## 2. Industry and System Analysis

The transportation and logistics domain combines **planning**, **execution**, and **visibility** over physical movement of goods. Software in this space must model deliveries linked to customers, assign drivers and vehicles, enforce workflow states, capture proof of delivery, notify stakeholders, and aggregate operational metrics. These requirements naturally produce **multi-role access patterns**: administrators configure the system; dispatchers manage day-to-day operations; drivers execute assigned deliveries; customers observe their own shipments. GURUNANAK implements these roles with distinct dashboards and authorization scopes enforced on both frontend route guards and backend middleware.

The **delivery lifecycle** spans statuses from `pending` through `assigned`, `picked_up`, `in_transit`, `out_for_delivery`, `delivered`, and `cancelled`, with strict transition validation on backend and frontend. **Fleet, driver, customer, and route management** provide CRUD and paginated list operations; dispatchers have operational access without full administrative control over fleet, drivers, customers, or settings (by design). **Tracking** is exposed through map-oriented pages fed by Socket.IO events; location updates originate from a **30-second server-side GPS simulator** (`trackingSimulator.js`) with a replaceable `gpsAdapter.js` hook—**not real telematics**. **Proof of Delivery (POD)** supports photo and signature capture via API and canvas UI. **Notifications** and **reports** (`/api/reports/summary` aggregation) support operational awareness.

**Functional requirements** encoded in the implementation include JWT authentication, role-based CRUD boundaries, paginated APIs (`page`, `limit`), rate limiting, CORS configuration, offline demo fallback when the API or MongoDB is unavailable, and health reporting via `/api/health`. Non-functional requirements include Docker-packaged deployment readiness, GitHub Actions CI, and local k6 performance measurement. Requirements are **implemented and test-backed**; they do not certify production SLA, real GPS accuracy, or verified cloud hosting. Table 1 summarizes role access derived from project documentation.

**Table 1 — Role access summary**

| Role | Primary capabilities |
|------|----------------------|
| Admin | Full CRUD: users, drivers, fleet, customers, routes, deliveries, reports, settings |
| Dispatcher | Operations: deliveries, assignment, routes, live tracking, reports |
| Driver | Assigned deliveries, status workflow, proof of delivery |
| Customer | Own deliveries and tracking only |

---

## 3. Literature Review

Modern enterprise applications in transportation and logistics require architectures that can evolve with changing business rules, support multiple user roles, and remain testable under load. Scholarly and industry literature converges on the view that scalability, modularity, and maintainability are not incidental coding outcomes but properties that must be **designed into** the separation of concerns among presentation, application, persistence, and integration layers [4]. The present review synthesizes authoritative work on full-stack architecture, RESTful services, modular and microservice-oriented design, cloud-native principles, containerization and DevOps, performance evaluation, and security—then relates these findings to the implemented GURUNANAK Transportation & Logistics platform.

This review distinguishes **literature findings** (what research and standards recommend) from **project implementation** (what the GURUNANAK codebase actually provides). The project is CODE FROZEN, containerized with Docker, validated by GitHub Actions CI, and performance-tested locally with k6; it has **not** been verified as deployed to a public cloud production environment.

### 3.1 Full-Stack Web Application Architecture

Software architecture literature defines architecture as the structure of a system and the intended interactions among its elements, distinct from algorithms, data structures, or line-level implementation [4]. Full-stack web applications extend this definition across at least four responsibilities: a **presentation layer** (user interface and client-side state), an **application layer** (business rules and orchestration), an **integration layer** (APIs and real-time channels), and a **persistence layer** (database and storage). Bass, Clements, and Kazman argue that quality attributes—modifiability, scalability, availability, and security—are substantially determined at the architectural level rather than introduced late in development [4].

Maintaining a full-stack system over time depends on **modular boundaries** that limit ripple effects when one layer changes. Client-server separation, a foundational constraint in network-based styles, allows independent evolution of user interface technology and server-side services provided that interface contracts remain stable [3]. For logistics platforms, this separation enables distinct experiences for administrators, dispatchers, drivers, and customers while sharing common delivery, fleet, and reporting logic on the server. Literature therefore supports layered full-stack design not as a technology stack label (e.g., MERN) but as an **architectural discipline** that assigns each concern a well-defined home and exposes narrow interfaces between layers [4].

**Relation to GURUNANAK:** The project implements a React (Vite) frontend, a Node.js/Express backend, REST services, MongoDB via Mongoose, and a client service layer with React Context—matching the literature’s layered model. Literature recommends strict layer separation; the project additionally provides an offline demo fallback in the frontend when the API is unavailable—a pragmatic extension not prescribed by classical architecture texts but documented in the repository README.

### 3.2 RESTful API and Backend Architecture

Fielding’s dissertation formalized Representational State Transfer (REST) as an architectural style emphasizing **scalability of component interactions**, **generality of interfaces**, and **independent deployment** of components [3]. REST’s client-server and **stateless** interaction constraints require each request to carry sufficient context for the server to process it without relying on stored session state on the server itself—though authentication tokens may be validated per request [3]. Stateless APIs simplify horizontal scaling because any instance can serve any request, provided shared state resides in external stores such as databases or caches.

API-based separation of concerns allows the frontend to depend on **resource-oriented contracts** rather than internal server implementation. Fielding notes that uniform interfaces and layered systems can reduce latency and encapsulate legacy components through intermediaries [3]. Trade-offs include increased round trips for chatty clients, the need for explicit versioning as contracts evolve, and the challenge of modeling real-time workflows purely through request-response cycles—motivating complementary mechanisms such as WebSockets or message buses in systems requiring live updates.

Backend architecture literature further associates REST with **validation at boundaries**, **role-aware authorization**, and **paginated collection endpoints** to control payload size under growth [4]. These practices align maintainability with scalability: small, predictable responses and explicit error semantics reduce client complexity and ease automated testing.

**Relation to GURUNANAK:** The backend exposes REST endpoints for deliveries, drivers, vehicles, customers, routes, notifications, reports, and authentication, with Zod validation and JWT middleware. Literature prescribes stateless REST; the project uses JWT bearer tokens validated per request, consistent with stateless API design. Real-time delivery updates are handled through **Socket.IO**, which literature treats as complementary to—not a replacement for—REST. Pagination is implemented server-side (`page`, `limit`), aligning with scalable collection retrieval described in architectural best practices.

### 3.3 Microservices and Modular Architecture

Microservices architecture organizes an application as a **suite of independently deployable services**, each scoped to a business capability, communicating via lightweight mechanisms such as HTTP APIs [2]. Lewis and Fowler identify benefits including technology heterogeneity, resilience through isolation, and **independent scalability** of components. They also document costs: distributed-system complexity, operational overhead, eventual consistency, and the need for mature deployment and monitoring practices [2]. Newman similarly emphasizes that microservices trade development simplicity for **organizational and runtime flexibility** at scale [10].

Modular architecture—whether deployed as a modular monolith or as microservices—supports maintainability when modules expose **stable interfaces** and hide internal change [4]. Literature does not require microservices for all systems; many enterprise applications achieve modularity through **internal package and service boundaries** within a single deployable unit, deferring service decomposition until team scale or load patterns justify operational complexity [2][10].

**Relation to GURUNANAK:** The literature on microservices informs background discussion only. **GURUNANAK is not a microservices architecture.** It is implemented as a **modular monolith**: Express route modules, controllers, Mongoose models, middleware, and frontend service modules provide internal separation without independent service deployment. This aligns with Fowler’s observation that distributed decomposition should follow demonstrated need rather than default choice [2]. The project’s Docker image packages frontend static assets and backend server together—a containerized modular monolith consistent with literature on staged evolution toward finer-grained services.

### 3.4 Cloud-Native Computing

The NIST definition of cloud computing describes five essential characteristics: **on-demand self-service**, **broad network access**, **resource pooling**, **rapid elasticity**, and **measured service** [1]. Cloud-native literature encourages **stateless processes**, **externalized configuration**, **disposable instances**, and **automated deployment** [5]. Containerization aligns with cloud-native goals by packaging applications with dependencies into portable units [7].

**Relation to GURUNANAK:** The project embodies **cloud-ready** rather than **cloud-deployed** characteristics. The multi-stage Dockerfile, environment-variable configuration, health endpoint (`/api/health`), and stateless JWT API design are consistent with NIST principles [1][5][7]. **Verified production deployment on IaaS or PaaS has not been established** in the repository.

### 3.5 Containerization and DevOps

Containerization packages an application and its runtime dependencies into an image executed consistently across environments [7]. Literature on continuous delivery emphasizes that **build, test, and deployment automation** reduce release risk and improve maintainability [12]. GitHub Actions implements CI workflows as code [8].

**Relation to GURUNANAK:** The repository includes a multi-stage Dockerfile and GitHub Actions workflow running frontend lint/build, backend Jest tests with MongoDB, and Docker build verification. The project implements **CI but not verified Continuous Deployment** to a cloud environment.

### 3.6 Scalability and Performance Evaluation

Architectural tactics—pagination, indexing, caching, replication, and load balancing—address scalability at different layers [4]. Literature agrees that **architectural intent must be validated empirically** [9]. Performance evaluation typically reports throughput, response time percentiles, and failure rates under defined concurrency profiles [9][13].

**Relation to GURUNANAK:** Verified k6 evidence exists: 5 VUs, 30 seconds, 225 HTTP requests, 0.00% failure rate, average 16.3 ms, p95 53.71 ms—**light concurrent load on localhost only**, not maximum-capacity or cloud proof.

### 3.7 Security and Maintainability

Maintainability and security intersect through **separation of concerns**, **least privilege**, and **validation at trust boundaries** [4]. JWT supports stateless verification on each API request [6].

**Relation to GURUNANAK:** JWT, bcrypt, RBAC, Zod, IDOR protection, Socket.IO auth, and automated security/RBAC tests are **implemented controls**; they do not imply formal certification.

### 3.8 Literature Synthesis

Across reviewed literature, modern full-stack architectures achieve scalability, modularity, and maintainability through **layered separation**, **stateless REST contracts**, **disciplined modular structure**, **cloud-compatible packaging**, **automated CI**, **empirical load measurement**, and **security at boundaries** [1]–[13]. GURUNANAK aligns with much of this guidance while gaps—no verified cloud deployment, no microservices (by design), limited performance evidence—reflect scope boundaries rather than necessarily defects.

---

## 4. Methodology

This study adopts an **applied design-and-evaluation methodology** aligned with software architecture practice: architectural requirements are derived from a transportation and logistics domain; a full-stack reference implementation is constructed as an evidence base; and quality attributes are verified through automated testing and controlled load measurement rather than asserted from design intent alone [4][9][13]. The approach is **descriptive and evaluative**: the GURUNANAK platform serves as a bounded case study through which literature on layered architecture, RESTful services, modular structure, containerization, security boundaries, and performance analysis is operationalized in code [3][4][12].

The methodology deliberately separates **what was built and measured** from **what literature or deployment guides propose for future production environments**. Implementation follows a modular monolith pattern packaged for container deployment; microservice decomposition is discussed in related literature but is **not** claimed for this project [2][10]. Continuous Integration (CI) is implemented and verified in GitHub Actions; **Continuous Deployment (CD) to a public cloud is not verified** in the repository. Performance evidence is limited to a documented local k6 run under light authenticated concurrency.

### 4.1 System Architecture and Implementation

The system follows a **layered full-stack architecture** with React presentation, Express application services, REST and Socket.IO integration, and MongoDB persistence via Mongoose [3][4]. The backend organizes routes, controllers, models, middleware, and utilities within a **single deployable Node.js process**—a modular monolith [2][10].

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

The frontend uses React 19, TypeScript, Vite, React Router with lazy-loaded routes, Context-based state (`AuthContext`, `AppContext`), REST service modules, and Socket.IO via `useSocket`. The backend uses Express middleware (CORS, rate limiting, JWT auth, RBAC, Zod validation, error handling), Mongoose models (User, Delivery, Driver, Vehicle, Customer, Route, Notification, ProofOfDelivery), pagination utilities, and role-aware delivery filters. **GPS tracking is SIMULATED** via `startTrackingSimulator` on a 30-second interval; `gpsAdapter.js` is a replaceable hook for future real telematics.

### 4.2 Security Methodology

Security controls include JWT [6], bcrypt password hashing, RBAC, Zod validation, rate limiting (production defaults: 100 auth requests per 15 minutes, 300 API requests per minute), CORS, and ownership checks (`assertDeliveryAccess`). Automated `security.test.js` and `rbac.test.js` suites exercise boundaries.

### 4.3 DevOps and Testing Methodology

**Docker** multi-stage build bundles Vite `dist` and Express server with HEALTHCHECK on `/api/health` [7]. **GitHub Actions CI** runs frontend lint/build, backend Jest (51 tests) with MongoDB 7, and Docker build [8][12]. **E2E testing** uses Playwright (`qa-playwright/`) against live frontend and backend; archived `results.json` records **105/109** passed. **Performance testing** uses k6 (`performance/load-test.js`) with 5 VUs, 30 seconds, authenticated JWT, and endpoints `/api/health`, `/api/deliveries?page=1&limit=20`, `/api/reports/summary` [9][13].

### 4.4 Methodological Limitations

Public cloud production deployment is **not verified** [1]. GPS is **simulated**. k6 used five virtual users for thirty seconds on localhost—adequate as a **light-concurrency baseline**, inadequate for capacity planning [9][13]. E2E reflects one archived run (105/109). CD is **not verified**; only CI and container build are evidenced [8][12].

---

## 5. Results

This section reports **measured and archived outcomes** from automated tests, load scripts, and documented QA artefacts. Throughout, **measured results** are distinguished from **implemented but unbenchmarked capabilities** and from **future or unverified deployment scenarios**.

### 5.1 Functional Results

The implemented platform supports four user roles—**administrator**, **dispatcher**, **driver**, and **customer**—each with role-specific dashboards and route access enforced on both frontend guards and backend middleware. Archived browser QA (`qa-playwright/results.json`) recorded successful login redirects for all four demo accounts, role-appropriate navigation, and operational page loads for deliveries, fleet, drivers, customers, routes, reports, notifications, and settings where permitted by design. Backend integration tests independently confirm that administrators and dispatchers can list operational resources while drivers and customers receive HTTP 403 on unauthorized collection endpoints.

**Delivery management** was verified through REST CRUD, paginated listing, status filtering, and strict workflow transitions. The archived E2E run passed create-delivery validation, successful creation with redirect to delivery details, and persistence after page refresh. **Fleet, driver, customer, and route management** pages loaded and rendered list data (fleet list count recorded as 20 entries). **Proof of Delivery** backend tests verify partial POD updates; archived E2E passed photo/signature visibility while full POD flow was **blocked** due to API preparation failure. **Live tracking** archived QA recorded GPS source as **SIMULATED GPS (`trackingSimulator`)**; **no real telematics was used or measured.**

### 5.2 Security Results

JWT authentication is verified by login tests, `/api/auth/me`, and HTTP 401 on protected routes without valid tokens [6]. bcrypt hashing is implemented; passwords are not returned in API responses. RBAC tests document allow/deny outcomes. Zod validation returns HTTP 400 with structured details [4]. Rate limiting, CORS, ownership checks, and generic forgot-password messaging (no reset token exposed) are **implemented and partially tested**; formal security certification was not performed.

### 5.3 Testing Results

| Layer | Artefact | Measured outcome |
|-------|----------|------------------|
| Backend integration | Jest (4 suites) | **51/51 tests passing** |
| Browser E2E | `qa-playwright/results.json` | **105/109 passed** (98.1%); 2 failed; 2 blocked |
| Performance | k6 authenticated local run | 300/300 checks; 0.00% HTTP failure |

**Playwright (105/109 — not 100%):** Two **FAIL** (unauthenticated `/dashboard`; invalid JWT logout behaviour) and two **BLOCKED** (pagination next; full POD flow). P1 create-delivery scenarios **passed** in archived run; targeted regression scripts exist for auth, create-delivery, and driver-route tests.

### 5.4 Performance Results

Performance was measured with **Grafana k6** against a **locally running** Express API using a **valid authenticated JWT** (`AUTH_TOKEN`).

**Table 2 — Verified k6 run (measured results)**

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

Test endpoints: `GET /api/health`, `GET /api/deliveries?page=1&limit=20`, `GET /api/reports/summary`.

**This result represents a local light-concurrency workload and should not be interpreted as a maximum-capacity or production benchmark.**

### 5.5 Scalability, Architecture, and CI Results

Implemented mechanisms include server-side pagination, MongoDB indexes, stateless JWT API, lazy-loaded frontend routes, Docker packaging, Socket.IO rooms, rate limiting, and modular separation—**horizontal scaling has not been benchmarked** [4][9]. GitHub Actions CI runs frontend lint/build, backend tests (51 Jest tests), and Docker build [8][12]. **Automatic CD to a cloud provider is not implemented or verified.**

---

## 6. Discussion

The Results section established what was measured; this Discussion interprets those outcomes in relation to architectural intent, literature, and the bounded scope of the GURUNANAK case study.

### 6.1 Interpretation of Findings

Taken together, the functional, security, testing, and performance results indicate that a **disciplined full-stack modular monolith** can satisfy a multi-role logistics domain with verifiable behaviour at the API layer and high—but incomplete—browser coverage. The **51/51 Jest pass rate** suggests core business rules are encoded consistently enough for repeatable automated verification. The **105/109 Playwright outcome** reveals operational pages largely behave as intended, yet security-route edge cases and two blocked scenarios remain in the archived record.

With respect to the research question, **modularity and maintainability** are demonstrated most strongly through layered separation, internal module boundaries, centralized middleware, and automated regression—not through independent microservice deployment [2][4][10]. **Scalability** is demonstrated only partially: architectural tactics were exercised under a **light local k6 profile** with zero HTTP failures and p95 53.71 ms, confirming stability at pilot concurrency but not establishing production headroom [9][13].

### 6.2 Scalability and Modularity

The GURUNANAK implementation adopts a **modular monolith**—internal service, controller, model, and middleware separation creates maintainability benefits [3][4] without microservice operational overhead [2][10]. Pagination, indexes, stateless JWT, lazy routes, Socket.IO rooms, Docker, and rate limiting are **implemented**; saturation point, multi-instance WebSocket behaviour, and horizontal scale-out are **not empirically benchmarked**.

### 6.3 Performance Interpretation

The verified k6 run must be read as a **sanity baseline**, not a capacity study [9][13]. Zero HTTP failures under five concurrent localhost clients indicate JWT middleware, paginated queries, and report aggregation remained stable at pilot load. Throughput of 7.28 requests/sec reflects scripted think-time and low concurrency—it is **not** an upper bound. **No claim** is warranted regarding maximum capacity, production performance, cloud performance, or horizontal scaling proof.

### 6.4 Security and Maintainability

JWT [6], bcrypt, RBAC, Zod, rate limiting, CORS, and ownership checks distribute security across predictable layers [4]. Oxlint, GitHub Actions CI [8][12], and multi-layer testing embed maintainability feedback loops. The archived **105/109 E2E result** shows client-side guard behaviour may lag server-side rigour in edge cases—frontend and backend policy must co-evolve.

### 6.5 DevOps, Cloud Trade-offs, and Deployment Planning

Docker and GitHub Actions CI address **reproducibility and integration risk** without constituting verified cloud deployment [7][8][12]. The multi-stage Dockerfile bundles Vite frontend and Express/Socket.IO server—matching analysis that **containerized deployment aligns best with the current monolithic codebase**, because Socket.IO and the GPS simulator depend on a **long-running process** ill-suited to classic serverless models without redesign [5].

The cloud cost trade-off analysis (qualitative, **not actual project spending**) examines deployment patterns relevant to this codebase:

**Frontend hosting:** Vercel suits Vite static builds with low operational overhead; AWS S3 + CloudFront offers consumption-based pricing and higher configuration complexity—appropriate when an organization already operates within AWS. Neither option was verified as deployed for this project.

**Backend hosting:** Render aligns with the existing Dockerfile and Express + Socket.IO monolith with predictable instance pricing; AWS/Azure container platforms (ECS Fargate, App Service, AKS) offer higher scalability and governance at increased operational cost. **CD to Render or other hosts is documented as proposed only**, not verified.

**Database:** MongoDB Atlas minimizes DBA labour via tiered cluster pricing; self-hosted MongoDB trades infrastructure cost for high maintenance effort. The application uses `MONGODB_URI` compatible with Atlas or local MongoDB.

**Serverless versus containerized:** Pure serverless is **not recommended** for the current architecture without refactoring, because WebSockets, background simulation, and persistent process state conflict with function-oriented models. **Containerized deployment is the recommended alignment** with existing artefacts.

**Table 3 — Qualitative deployment comparison (not measured billing)**

| Option | Cost model (qualitative) | Fit for GURUNANAK |
|--------|--------------------------|-------------------|
| Vercel (frontend) | Tiered / usage | Demo SPA; separate backend required |
| Render (backend container) | Fixed monthly tiers | Strong pilot fit; WS scaling needs extra work |
| MongoDB Atlas | Tiered cluster pricing | Default DB choice; not verified deployed |
| Serverless API | Per-invocation | Poor fit for Socket.IO monolith |
| Current Dockerfile | Instance uptime | **Best alignment** with codebase |

Pragmatic deployment ladder: (1) **research/demo tier** — static frontend + Render container + Atlas; (2) **institutional production tier** — enterprise containers + dedicated Atlas + CDN. **No verified production deployment or measured cloud costs** exist. Operational trade-offs include WebSocket sticky sessions and Redis adapters for multi-instance Socket.IO—future engineering concerns.

### 6.6 Comparison with Literature

Project outcomes **corroborate** literature: REST/stateless JWT [3][6], modular monolith over premature microservices [2][10], cloud-ready packaging [1][5][7], empirical pilot testing [9][13], security at boundaries [4][6], CI without verified CD [8][12]. The case study sits in literature’s **middle ground**: recommended patterns for a pilot system, stopping short of production-scale aspirations.

### 6.7 Discussion Limitations

Limitations include local light-concurrency k6 only, **simulated GPS**, **no verified cloud deployment**, **no automatic CD**, E2E **105/109** not 100%, offline/demo fallback not equivalent to production multi-user behaviour, and README-documented scope limits (client-only support/settings, optional email/Cloudinary integrations, dispatcher scope restrictions).

### 6.8 Answer to the Research Question (Discussion)

Modern full-stack architectures **ensure** scalability, modularity, and maintainability through **combinations of structural discipline, boundary enforcement, automation, and measured validation**—not a single technology choice. **Modularity and maintainability** are the most strongly supported outcomes in this project [2][4][10][12]. **Scalability** is **partially ensured** architecturally and **lightly confirmed** empirically by k6 [9][13]. The answer is **conditional**: mechanisms can be embedded and baseline stability verified, but production-scale performance, cloud elasticity, and horizontal scale-out cannot be guaranteed on present evidence alone.

---

## 7. Conclusion

This paper presented the design, implementation, and evaluation of GURUNANAK Transportation & Logistics—a full-stack transportation and logistics management system built as a modular monolith with React, Express, MongoDB, Docker, GitHub Actions CI, JWT/RBAC security, and Socket.IO complemented by **simulated GPS** tracking.

**Key findings:** (1) layered architecture and internal modular separation support multi-role logistics workflows with **51/51 backend tests passing**; (2) archived browser QA achieved **105/109** scenarios passed—not 100%—with documented failures and blocked cases; (3) authenticated local k6 measurement under five virtual users for thirty seconds yielded **225 HTTP requests**, **0.00% failure rate**, **16.3 ms average**, and **53.71 ms p95**, passing all 300 checks; (4) scalability tactics (pagination, indexes, stateless JWT, Docker, rate limiting) are **implemented** but **not benchmarked at scale**; (5) CI is verified; **CD and cloud deployment are not**.

**Answer to the research question:** Modern full-stack architectures ensure scalability, modularity, and maintainability by **designing separation of concerns**, **enforcing security at boundaries**, **automating verification through CI and tests**, and **measuring performance under explicit, bounded workloads**. This project demonstrates that path for a pilot logistics platform while refusing to overclaim production cloud performance, maximum capacity, real telematics, or horizontal scaling proof.

**Practical contribution:** a CODE FROZEN, test-documented reference implementation with research artefacts suitable for academic evaluation of full-stack architectural practice in transportation and logistics.

**Limitations:** simulated GPS; local k6 only; no verified cloud deployment; no automatic CD; incomplete E2E pass rate; qualitative cloud cost analysis only; no horizontal scaling benchmark.

**Future work** may include: real GPS/telematics adapter implementation; verified production cloud deployment; automatic CD pipelines; horizontal scaling and WebSocket multi-instance evaluation; higher-concurrency and cloud-hosted load testing; backend support/settings services; Cloudinary and email provider integrations; optional microservice decomposition if operational need is demonstrated [2][10].

---

## References

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

## Appendices

### Appendix A — Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Routing | React Router (lazy-loaded routes) |
| UI | Lucide React, Recharts, Leaflet + OpenStreetMap |
| State | React Context + service layer with demo fallback |
| Backend | Node.js, Express.js, Socket.IO |
| Auth | JWT + bcrypt |
| Validation | Zod (backend) |
| Database | MongoDB / MongoDB Atlas via Mongoose |
| DevOps | Docker (HEALTHCHECK), GitHub Actions, k6 |

### Appendix B — API Endpoint Summary

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
| GET/POST/PUT/DELETE | `/api/drivers` | Drivers |
| GET/POST/PUT/DELETE | `/api/vehicles` | Fleet |
| GET/POST/PUT/DELETE | `/api/customers` | Customers |
| GET/POST/PUT/DELETE | `/api/routes` | Routes |
| GET | `/api/reports/summary` | MongoDB aggregation summary |
| GET/PATCH/DELETE | `/api/notifications` | Notifications |

### Appendix C — Delivery Workflow States

Statuses: `pending` → `assigned` → `picked_up` → `in_transit` → `out_for_delivery` → `delivered`; `cancelled` permitted per validation rules. Transitions enforced on backend and frontend.

### Appendix D — Testing Summary

| Test layer | Tool | Measured result |
|------------|------|-----------------|
| Backend integration | Jest + Supertest (4 suites) | **51/51 passing** |
| Browser E2E | Playwright (`qa-playwright/results.json`) | **105/109 passed**; 2 failed; 2 blocked |
| Performance | k6 (`performance/load-test.js`) | See Appendix E |
| CI | GitHub Actions | Lint, build, Jest, Docker build |

Targeted regression scripts: `test-auth-regression.mjs`, `test-create-delivery.mjs`, `test-driver-delivery-route.mjs`, `test-demo-login.mjs`.

### Appendix E — k6 Test Configuration and Results

**Script:** `performance/load-test.js`  
**Environment:** localhost; `AUTH_TOKEN` = valid authenticated JWT  
**Profile:** 5 VUs, 30 seconds, threshold `http_req_failed < 0.1`

| Metric | Value |
|--------|-------|
| Iterations | 75 |
| HTTP requests | 225 |
| Checks | 300 passed / 0 failed |
| HTTP request failure rate | 0.00% |
| Average response time | 16.3 ms |
| p90 | 30.22 ms |
| p95 | 53.71 ms |
| Throughput | 7.28 requests/sec |
| Threshold | PASSED |
| Exit code | 0 |

**Endpoints per iteration:** `GET /api/health`; `GET /api/deliveries?page=1&limit=20`; `GET /api/reports/summary`.

**Scope statement:** Local light-concurrency workload only—not maximum-capacity, production, or cloud benchmark.

### Appendix F — Architecture and Evidence Checklist

| Claim | Status |
|-------|--------|
| Modular monolith implemented | **Implemented** |
| JWT + RBAC + Zod | **Implemented**; backend tests pass |
| Simulated GPS tracking | **Implemented**; explicitly not real telematics |
| Pagination + MongoDB indexes | **Implemented** |
| Docker + HEALTHCHECK | **Implemented**; CI build verified |
| GitHub Actions CI | **Implemented** |
| k6 light-load baseline | **Measured** (Appendix E) |
| Playwright E2E | **Measured** 105/109 archived |
| Cloud production deployment | **Not verified** |
| Automatic CD | **Not verified** |
| Horizontal scaling benchmark | **Not evaluated** |
| Cloud cost/billing | **Not measured** (qualitative analysis only) |
| Maximum system capacity | **Not measured** |

### Appendix G — Socket.IO Events

**Client → Server:** `track:subscribe` (join delivery tracking room)

**Server → Client:** `delivery:created`, `delivery:updated`, `delivery:statusChanged`, `driver:locationUpdated`, `vehicle:locationUpdated`, `notification:new`

Location events in full-stack mode originate from **trackingSimulator** (SIMULATED GPS).

---

*Prepared for GURUNANAK Transportation & Logistics. Application codebase unchanged (CODE FROZEN). Assembled from verified repository artefacts and existing research documents.*
