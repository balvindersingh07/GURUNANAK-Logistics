# Cloud Cost Trade-offs

## GURUNANAK Transportation & Logistics

**Document type:** Research paper section (Discussion)  
**Project status:** CODE FROZEN — implementation verified locally; **no verified production cloud deployment** at the time of writing  
**DevOps evidence in repository:** multi-stage Docker image, GitHub Actions CI (lint, build, Jest, Docker build)  
**Measured performance evidence (local authenticated k6 run):** 5 virtual users, 30 seconds, 225 HTTP requests, 0.00% HTTP request failure rate, average response time 16.3 ms, p95 53.71 ms — *not* cloud-hosted measurements

---

## 1. Introduction and Scope

The GURUNANAK Transportation & Logistics platform is implemented as a MERN-oriented full-stack system comprising a React (Vite) single-page application, a Node.js/Express REST API with Socket.IO for real-time delivery updates, and MongoDB persistence via Mongoose. The repository includes containerization (Docker) and continuous integration (GitHub Actions), but deployment guidance in the README is **documentary only**; the application has **not** been verified as deployed to Vercel, Render, AWS, Azure, or any other public cloud provider.

This section examines **architectural and operational trade-offs** among common cloud deployment patterns relevant to this project. It does **not** report actual production billing, negotiated enterprise pricing, or measured cloud latency. Where performance is discussed, it is distinguished from the verified local k6 baseline cited above. Cost considerations are described qualitatively using **cost models** (pay-per-use, fixed monthly tiers, consumption-based compute, and operational labour) rather than invented dollar figures.

The analysis assumes a typical deployment topology for this codebase: static frontend assets, a long-running backend process (HTTP + WebSocket), and a document database supporting CRUD, aggregation (reports), and indexed queries.

---

## 2. Frontend Hosting

### 2.1 Vercel versus AWS S3 + CloudFront

#### Vercel

Vercel aligns naturally with the project’s Vite production build, which emits static assets to `dist/`. Deployment would consist of connecting the repository, configuring `npm run build`, and setting environment variables (`VITE_API_URL`, `VITE_SOCKET_URL`) for API and Socket.IO endpoints.

**Cost considerations:** Vercel typically employs a **tiered subscription or usage-based model** combining build minutes, bandwidth, and serverless function invocations (not required for a pure static SPA). For academic or pilot deployments with moderate traffic, the free or low-tier hobby plan may suffice; commercial logistics usage with many concurrent map and dashboard users would eventually incur bandwidth and build costs. Hidden costs include team seats, preview deployments, and overage charges.

**Scalability:** Edge caching and global CDN distribution scale frontend delivery efficiently for static assets. The SPA itself does not execute server-side business logic on Vercel unless additional serverless functions are introduced.

**Maintenance and operational effort:** Operational overhead is **low**. SSL, CDN, and build pipelines are largely managed. Developers focus on build configuration and environment variables rather than infrastructure provisioning.

**Performance considerations:** Static asset delivery is generally strong at the edge. Application perceived performance still depends on backend API latency and WebSocket connectivity to the backend host—not on the frontend host alone. The verified k6 metrics apply to the **API layer** on localhost and must not be extrapolated to Vercel edge performance.

**Reliability:** Managed platform SLAs and automatic failover for static hosting are advantageous for demonstration and small-scale production. Uptime of the overall system remains dependent on backend and database availability.

**Complexity:** **Low** for a Vite SPA. CORS and API URL configuration must align with the backend origin.

**When appropriate for this project:** Suitable for **demonstration, academic submission, preview environments, and early-stage pilots** where the team prioritizes rapid deployment of the React frontend with minimal DevOps. Appropriate when the backend is hosted separately (e.g., Render or a container platform) and Socket.IO is directed to that backend URL.

#### AWS S3 + CloudFront

This pattern stores built static files in S3 and distributes them through CloudFront (CDN).

**Cost considerations:** AWS pricing is **consumption-based**: S3 storage, PUT/GET requests, CloudFront data transfer out, and optional WAF or Route 53 charges. At low traffic, costs can remain minimal; at scale, **egress bandwidth** often dominates. Unlike Vercel’s bundled developer experience, each service is billed separately. Operational labour (IAM, bucket policies, invalidation) represents an indirect cost.

**Scalability:** S3 and CloudFront scale to very large global audiences. This architecture is proven for high-traffic static sites.

**Maintenance and operational effort:** **Moderate to high** relative to Vercel. Teams must manage IAM roles, bucket policies, TLS certificates (often via ACM), cache invalidation after deploys, and CI/CD integration (e.g., GitHub Actions uploading artifacts—already present in this repository for build verification).

**Performance considerations:** CloudFront provides strong global cache performance. Fine-grained cache-control headers must be configured for SPA routing (fallback to `index.html`). API and WebSocket performance remain backend-bound.

**Reliability:** AWS offers mature multi-AZ and global edge infrastructure. Uptime depends on correct configuration and monitoring.

**Complexity:** **Moderate.** More flexible than Vercel but requires cloud architecture knowledge.

**When appropriate for this project:** Appropriate when the organization **already operates within AWS**, requires **fine-grained cost control**, compliance boundaries, or integration with other AWS services (e.g., Cognito, WAF, centralized logging). Less ideal for a minimal academic deployment unless AWS familiarity already exists.

---

## 3. Backend and Container Hosting

### 3.1 Render versus AWS/Azure Container-Based Hosting

The GURUNANAK backend is an **Express HTTP server with Socket.IO**, a **GPS tracking simulator**, MongoDB connections, and JWT authentication. The Dockerfile produces a **multi-stage image** bundling the Vite `dist` output and the Node server, exposing port 5000 with a `/api/health` HEALTHCHECK—indicating **container-first** deployment readiness rather than a decomposed serverless function model.

#### Render

Render supports web services from Docker images or Node build commands, environment variables (`JWT_SECRET`, `MONGODB_URI`, `CORS_ORIGIN`), and binding to `0.0.0.0:$PORT` as documented in the README.

**Cost considerations:** Render uses **fixed monthly instance pricing** by plan tier (free/starter/production classes) plus potential charges for persistent disks, background workers, and database add-ons if used. Predictability is high for small deployments; costs rise with instance size, always-on services, and horizontal scaling.

**Scalability:** Vertical scaling (larger instance) is straightforward. Horizontal scaling and WebSocket session affinity require additional configuration. Socket.IO workloads may need sticky sessions or a Redis adapter for multi-instance deployments—a complexity not implemented in the current codebase.

**Maintenance and operational effort:** **Low to moderate.** Render manages TLS, deploy hooks, and runtime environment. Teams configure environment variables and connect GitHub for CI/CD (CI exists in-repo; **CD to Render is not configured**).

**Performance considerations:** Performance depends on instance size, region, and database proximity. The verified local k6 result (16.3 ms average under light load) demonstrates API responsiveness in development but **does not predict** Render production latency.

**Reliability:** Managed platform with health checks aligns with the project’s Dockerfile HEALTHCHECK. Free tiers may sleep on inactivity, affecting demo availability.

**Complexity:** **Low** for single-container deployment matching the existing Docker image.

**When appropriate for this project:** Strong fit for **academic demos, capstone deployment, and small-team pilots** where Docker is already validated and operational overhead must remain low. Suitable when MongoDB Atlas is used as the external database.

#### AWS/Azure Container-Based Hosting (e.g., ECS/Fargate, App Service, AKS)

These platforms run the same Docker image with enterprise-grade orchestration.

**Cost considerations:** **Variable and consumption-based**—CPU/memory allocation, load balancer hours, container registry storage, logging, and egress. Fargate/App Service simplify operations but can exceed PaaS fixed pricing at sustained load. Self-managed Kubernetes (EKS/AKS) adds control-plane and node costs plus staffing.

**Scalability:** **High.** Auto-scaling, load balancing, and multi-region strategies are supported. Socket.IO at scale requires architectural additions (Redis pub/sub, sticky sessions).

**Maintenance and operational effort:** **High.** Networking (VPC/VNet), secrets management, IAM/RBAC, monitoring, patching, and deployment pipelines require dedicated DevOps capacity—partially offset by existing GitHub Actions CI and Docker in this project.

**Performance considerations:** Tuneable via instance sizing, proximity to MongoDB Atlas region, and CDN for static assets if frontend is split. Enterprise SLAs can exceed small PaaS offerings.

**Reliability:** Strong for production logistics platforms with redundancy, health probes (compatible with `/api/health`), and automated recovery—at increased cost and complexity.

**Complexity:** **High** relative to Render.

**When appropriate for this project:** Appropriate for **institutional or commercial production** deployments where compliance, audit, multi-tenant isolation, and long-term scalability outweigh simplicity. Less appropriate for a research prototype unless cloud credits or existing institutional AWS/Azure tenancy are available.

---

## 4. Database

### 4.1 MongoDB Atlas versus Self-Hosted MongoDB

The application uses Mongoose models (Delivery, Driver, Customer, Vehicle, Route, User, Notification, ProofOfDelivery) with indexes on frequently queried fields and aggregation in `/api/reports/summary`.

#### MongoDB Atlas

**Cost considerations:** **Tiered monthly pricing** (shared M0 free tier through dedicated clusters). Costs increase with storage, IOPS, backup retention, and cross-region replication. Atlas reduces DBA labour—a significant indirect saving for small teams.

**Scalability:** Horizontal sharding and replica sets are managed. Suitable for growing delivery and tracking datasets.

**Maintenance and operational effort:** **Low.** Patches, backups, monitoring, and failover are largely managed. Connection string configuration via `MONGODB_URI` matches the existing `.env` pattern.

**Performance considerations:** Latency improves when Atlas cluster region aligns with the backend host. Index design in the repository supports query efficiency; Atlas performance still depends on cluster tier and workload.

**Reliability:** Automated backups and replica sets improve durability for logistics records and proof-of-delivery data.

**Complexity:** **Low** for integration with Render, Vercel-backed SPAs, or container hosts.

**When appropriate for this project:** **Recommended default** for demonstration, research deployment, and production pilots—especially because the README and seed workflow already assume Atlas-compatible URIs.

#### Self-Hosted MongoDB

**Cost considerations:** **Infrastructure plus labour**—VM or container compute, disk, backup storage, and administrator time. Direct software licensing is open-source (Community) or subscription (Enterprise). At small scale, compute may appear cheaper than Atlas; **total cost of ownership** often favours Atlas when DBA time is included.

**Scalability:** Manual scaling—replica set configuration, sharding, and hardware provisioning.

**Maintenance and operational effort:** **High.** OS patching, MongoDB upgrades, backup verification, security hardening, and disaster recovery are team responsibilities. The Docker Compose/local dev pattern in this project does not replace production DBA processes.

**Performance considerations:** Can be tuned on dedicated hardware; performance risk if under-provisioned on shared VMs.

**Reliability:** Depends entirely on team practices; misconfigured backups pose risk to delivery and POD records.

**Complexity:** **Moderate to high.**

**When appropriate for this project:** Consider only when **institutional policy mandates on-premises data residency**, existing MongoDB operations staff are available, or cloud database egress costs are prohibitive at very large scale.

---

## 5. Deployment Architecture: Serverless versus Containerized

### 5.1 Serverless Deployment

A serverless approach would decompose the API into functions (e.g., AWS Lambda, Azure Functions) and potentially use managed API Gateway, with the frontend on static hosting.

**Cost considerations:** **Pay-per-invocation and duration** can minimize cost at low or spiky traffic. Continuous logistics workloads (dashboard polling, Socket.IO, GPS simulator interval) may incur **sustained charges** less predictable than a small always-on container. WebSocket support and long-lived connections are **poorly aligned** with classic function models.

**Scalability:** Automatic scaling per request for stateless HTTP handlers. **Not a natural fit** for Socket.IO rooms, simulated GPS intervals (`trackingSimulator.js`), and persistent in-process state without additional services (API Gateway WebSocket, ElastiCache, etc.).

**Maintenance and operational effort:** Low for individual functions; **high** when retrofitting this monolithic Express + Socket.IO codebase, which would require **substantial re-architecture**—contrary to the current CODE FROZEN scope.

**Performance considerations:** Cold starts may affect latency-sensitive dashboards. The verified k6 baseline reflects a **long-running Node process**, not cold-start behaviour.

**Reliability:** Managed scaling with caveats for connection-oriented features.

**Complexity:** **High** for this specific project without code changes.

**When appropriate for this project:** **Not recommended** for the current architecture. Theoretically suitable only if the system were redesigned into stateless REST micro-functions **without** Socket.IO and background simulators—or if those concerns were moved to separate managed services.

### 5.2 Containerized Deployment

The repository’s Dockerfile validates a **containerized** path: build frontend, copy `dist` into the image, run Express on port 5000, HEALTHCHECK on `/api/health`. GitHub Actions already builds this image in CI.

**Cost considerations:** **Predictable instance-based billing** on Render, ECS Fargate, Azure App Service, or similar. Costs map to allocated CPU/RAM and uptime. Suitable for always-on logistics APIs.

**Scalability:** Horizontal scaling with load balancer; Socket.IO requires additional design for multi-instance (not currently implemented).

**Maintenance and operational effort:** **Moderate** with PaaS (Render); **higher** on raw Kubernetes. CI is already automated; CD remains a documentation/planning step.

**Performance considerations:** The verified k6 run demonstrates stable behaviour for a **single local container/process** under light concurrent load. Container orchestration adds network hop latency but enables regional placement.

**Reliability:** HEALTHCHECK aligns with orchestrator restarts. Suitable for production when paired with Atlas backups.

**Complexity:** **Low to moderate**—matches existing artifacts.

**When appropriate for this project:** **Recommended alignment** with the implemented system. Container deployment on Render (pilot) or AWS/Azure (production) preserves Express, Socket.IO, and the GPS simulator without architectural rework.

---

## 6. Synthesis for GURUNANAK Transportation & Logistics

Given the current implementation—React SPA, Express + Socket.IO monolith, MongoDB, Docker, GitHub Actions CI, and **local** k6 verification—a pragmatic deployment ladder emerges:

1. **Research / demo tier:** Static frontend (Vercel or S3+CloudFront) + container backend (Render) + MongoDB Atlas M0/M10. Lowest operational burden; no verified cloud deployment yet.
2. **Institutional production tier:** AWS or Azure container service + Atlas dedicated tier + S3/CloudFront or enterprise CDN. Higher cost and complexity; stronger governance.
3. **Not recommended without redesign:** Pure serverless for the present codebase due to Socket.IO and background simulation.

Cost optimization for this project should prioritize **(a)** colocating backend and database regions, **(b)** right-sizing a single container before horizontal scaling, **(c)** using Atlas managed backups for delivery/POD data, and **(d)** separating static frontend hosting (cheap CDN) from compute-heavy API/report aggregation.

---

## 7. Comparison Table

| Option | Cost Model | Scalability | Maintenance | Best Fit |
|--------|------------|-------------|-------------|----------|
| **Vercel (frontend)** | Tiered / usage (builds, bandwidth) | High for static SPA | Low | Academic demos, rapid SPA deploy, separate backend |
| **AWS S3 + CloudFront (frontend)** | Consumption (storage, egress, requests) | Very high globally | Moderate | AWS-centric orgs, cost control at scale |
| **Render (backend container)** | Fixed monthly instance tiers | Moderate (vertical; WS needs extra work) | Low–moderate | Capstone/pilot Docker deploy, small teams |
| **AWS/Azure containers** | Consumption + infrastructure hours | High with orchestration | High | Production, compliance, enterprise SLA |
| **MongoDB Atlas** | Tiered cluster pricing | High (managed scaling) | Low | Default DB choice for this project |
| **Self-hosted MongoDB** | VM + disk + labour | Manual | High | On-premises mandate, existing DBA team |
| **Serverless (API)** | Per-invocation / duration | High for stateless HTTP only | Moderate (after refactor) | **Poor fit** for current Socket.IO monolith |
| **Containerized (current Dockerfile)** | Instance uptime / container units | Moderate–high | Moderate | **Best alignment** with existing codebase |

---

## 8. Limitations of This Analysis

- No production cloud deployment or billing data exists for this project.
- Cost figures are intentionally omitted to avoid fabricated metrics.
- The k6 results cited are **local authenticated measurements** under 5 VUs for 30 seconds and must not be presented as cloud performance guarantees.
- Optional integrations noted in the README (Cloudinary, email provider) would add further cost dimensions not quantified here.
- Horizontal scaling of Socket.IO and rate-limit tuning under multi-instance deployment are future engineering concerns.

---

*Prepared for inclusion in the GURUNANAK Transportation & Logistics research paper — Discussion section.*
