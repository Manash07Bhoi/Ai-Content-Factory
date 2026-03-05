# AI Content Factory - Master Execution Plan

This document outlines the structured execution plan for building the AI Content Factory platform. The project is divided into manageable sessions (approx. 40-60 sessions total) designed for an iterative, AI-assisted development workflow. Each session focuses on implementing, verifying, and testing specific backend modules, major infrastructure tasks, or frontend screens.

## Architecture & Principles
*   **Dual Database:** PostgreSQL (Business State) and MongoDB (AI Content).
*   **Asynchronous Processing:** Heavy tasks (AI Generation, PDF/ZIP building) are offloaded to BullMQ queues.
*   **Frontend Stack:** React, Vite, TypeScript, TailwindCSS, Shadcn UI, TanStack Query.
*   **Backend Stack:** NestJS, TypeScript, TypeORM, Mongoose, BullMQ, Stripe.
*   **Security & Observability:** Helmet, CORS, CSRF, Rate Limiting, Pino/Winston logging, Prometheus/Grafana metrics.

---

## Phase 1: Foundation, Core Workflows & Marketplace

### Section 1: Infrastructure & Scaffolding
**Session 1: Project Initialization & Infrastructure Scaffolding**
*   Initialize Git repository.
*   Scaffold NestJS backend application (`src/`).
*   Scaffold React Vite frontend application (`frontend/`) with TailwindCSS and Shadcn UI.
*   Create `docker-compose.yml` (PostgreSQL, MongoDB, Redis). *(Note: Elasticsearch moved to Phase 2).*
*   Set up environment configuration parsing (`.env.example`).
*   Implement API Versioning (`/api/v1`).
*   Configure basic security middlewares (Helmet, CORS, CSRF protection setup).
*   Implement structured logging (Winston or Pino) with request IDs.
*   Set up basic health check endpoints (Observability foundation).

**Session 2: Database Connectivity & Core Config**
*   Configure TypeORM (PostgreSQL) and Mongoose (MongoDB) database connections.
*   Set up global exception filters (RFC 7807 Problem Details), validation pipes, and response interceptors.
*   Implement input sanitization and DTO structures.

### Section 2: Identity & Security
**Session 3: User Management**
*   Create `users` module and PostgreSQL entity (UUID, roles: admin/reviewer/customer, soft deletes).
*   Implement basic user CRUD operations.

**Session 4: Authentication & Rate Limiting**
*   Create `auth` module (JWT access/refresh strategy via Passport.js).
*   Implement `register`, `login`, `refresh`, `logout` endpoints.
*   Implement `RolesGuard`, `JwtAuthGuard`, `@CurrentUser`, `@Public`, `@Roles` decorators.
*   Implement Rate Limiting using `@nestjs/throttler` to protect endpoints.

### Section 3: Asynchronous Processing & AI Foundation
**Session 5: Queue System Architecture (BullMQ)**
*   Install BullMQ and integrate Redis queues into the application.
*   Setup Queue Dashboard (Bull Board) for admin visibility.
*   Create robust queue worker patterns (error handling, retries, backoff).

**Session 6: AI Generator Foundation**
*   Create `ai-generator` module.
*   Implement `LLMClientService` wrapping OpenAI/Anthropic APIs with cost tracking.
*   Create prompt templates directory structure.
*   Create basic `prompts` Mongoose schema.
*   Implement the asynchronous workflow: API `POST /ai/generate/prompts` -> Queue Job -> Worker -> LLM Call -> MongoDB save.

### Section 4: Content Generation & Curation
**Session 7: Categorisation & Quality Scoring**
*   Create `categorisation` module.
*   Implement `scoreQuality(text)`, `extractTags(text)`, and `categorise(text)` logic.
*   Integrate categorisation into the AI generation queue worker.

**Session 8: Expanding Content Types (Scripts & Posters)**
*   Create Mongoose schemas: `scripts`, `posters`.
*   Extend `ai-generator` module to handle specific prompt templates and queue jobs for these types.

**Session 9: Expanding Content Types (Social Posts & Logs)**
*   Create Mongoose schema: `social_posts`, `generation_logs`.
*   Extend `ai-generator` module to handle social post generation.
*   Implement generation batch logging in MongoDB.

**Session 10: Review & Approval Workflow (Backend)**
*   Create `approvals` module and PostgreSQL entity.
*   Hook into the generation pipeline: create pending `approvals` records when new content scores >= threshold.
*   Implement `GET /approvals/pending` queue endpoint.
*   Implement `POST /approvals/:id/approve` and `POST /approvals/:id/reject` with bulk actions.

### Section 5: Packaging & Marketplace Preparation
**Session 11: Storage Management**
*   Create `storage` module wrapping AWS S3 / Cloudinary (or mock local storage for dev).
*   Implement file validation middleware (size, type).

**Session 12: Product Management**
*   Create `products` module and PostgreSQL entity.
*   Implement manual creation (`POST /products`) and publishing (`PATCH /products/:id/publish`).
*   Create CRUD endpoints for managing the product catalog.

**Session 13: Product Builder (Asynchronous Packaging)**
*   Create `product-builder` module.
*   Implement PDFKit generation for Prompts, Scripts, Posters, and Social packs.
*   Implement Archiver ZIP bundling.
*   Implement `POST /products/create-pack` endpoint -> Queue Job -> Worker -> PDF/ZIP -> S3 Upload.

### Section 6: Monetization & Delivery
**Session 14: Orders & Payments (Stripe)**
*   Create `orders` module and `Order` / `OrderItem` PostgreSQL entities.
*   Implement `POST /orders/checkout` to create a Stripe Payment Intent.

**Session 15: Webhooks & Order Fulfillment**
*   Implement Stripe Webhook handler (`POST /orders/webhook`) for `payment_intent.succeeded`.
*   Handle order status updates upon successful payment.

**Session 16: Secure Downloads Delivery**
*   Create `downloads` module and PostgreSQL entity (tracking download limits).
*   Implement `GET /downloads/:productId/link` to generate 15-min signed S3 URLs.
*   Implement public `GET /products` marketplace listing and `GET /products/:id` endpoints.

### Section 7: Frontend Admin UI
**Session 17: Admin Dashboard UI Foundation**
*   Build the core layout, routing, and navigation for the Admin interface using React/Vite/Shadcn.
*   Implement Admin Authentication and protected routes.

**Session 18: AI Generator & Automation UI**
*   Build the AI Generator Panel (`/admin/generator`).
*   Connect to backend generation endpoints.

**Session 19: Review Queue UI**
*   Build the Human-in-the-Loop Review Queue Panel (`/admin/review`).
*   Implement inline editing and approve/reject actions.

**Session 20: Product Builder UI**
*   Build the Product Builder Screen (`/admin/product-builder`).
*   Connect to the async packaging workflow.

### Section 8: Frontend Marketplace UI
**Session 21: Public Marketplace Listings**
*   Build the public-facing `/marketplace` layout and product grid.
*   Implement basic filtering and pagination.

**Session 22: Product Detail & Checkout Flow**
*   Build the Product Detail page (`/marketplace/:slug`).
*   Implement the shopping cart state (client-side/Redis) and Checkout UI (Stripe Elements integration).

**Session 23: Customer Account Portal**
*   Build the Customer Orders view (`/account/orders`).
*   Implement the secure download button flow.

---

## Phase 2A: Platform Intelligence & Automation

### Section 9: Advanced Automation & Deduplication
**Session 24: Basic Automation Schedulers (Cron)**
*   Create `automation` module.
*   Set up daily `@Cron` jobs for Prompts, Scripts, Posters, and Social Posts that enqueue BullMQ jobs.
*   Implement the Archive Rejected content cleanup job.

**Session 25: Content Deduplication (pgvector)**
*   Add `pgvector` extension to PostgreSQL setup.
*   Create `content_embeddings` PostgreSQL table.
*   Implement `content-embedding` queue job to embed approved/new text.
*   Integrate cosine similarity checks into the generation pipeline to auto-reject duplicates.

**Session 26: Smart Auto-Approval Engine**
*   Create `auto_approval_decisions` MongoDB collection.
*   Implement logic to analyze past approvals and auto-approve high-confidence items.
*   Integrate into the generation pipeline.

### Section 10: Intelligence Engines
**Session 27: Trend Intelligence Engine**
*   Create `trend_signals` MongoDB collection.
*   Implement Trend Intelligence cron to fetch/score topics (mocking external APIs initially).
*   Feed trending topics into the AI generation prompt construction.

**Session 28: Content Repurposing Engine**
*   Implement logic to repurpose high-performing content (e.g., Script -> Social posts).
*   Ensure repurposed items pass through the deduplication workflow.

**Session 29: Dynamic Pricing Engine**
*   Create `price_history` PostgreSQL table.
*   Implement Dynamic Pricing Engine logic based on sales velocity and demand signals.

**Session 30: Automated SEO Metadata Generation**
*   Implement `seo-generation` queue job to populate SEO metadata (titles, descriptions, JSON-LD) on product publish.

### Section 11: Phase 2A Frontend & Search
**Session 31: Admin Intelligence Dashboards**
*   Build Analytics & Revenue Intelligence UI (`/admin/analytics`).
*   Build Trend Intelligence Dashboard UI (`/admin/trends`).

**Session 32: System Health & Observability UI**
*   Build System Health Monitor UI (`/admin/system`).
*   Integrate Prometheus metrics visualization if applicable.

**Session 33: Elasticsearch Foundation & Indexing**
*   Add Elasticsearch to the Docker stack.
*   Implement the `products` index and syncing logic (whenever products are published/updated).

**Session 34: Global Search UX**
*   Build robust global Search Results page (`/search`) powered by Elasticsearch.
*   Implement faceted search, autocomplete, and 'Did you mean?' features.

---

## Phase 2B: Marketing Automation & Community

### Section 12: Promotional Features
**Session 35: Coupons System**
*   Create `coupons` PostgreSQL entity and CRUD endpoints.
*   Modify checkout flow to accept coupon validation and apply discounts.

**Session 36: Product Bundles**
*   Create `product_bundles` PostgreSQL entity and management endpoints.
*   Update frontend marketplace to display and sell bundles.

**Session 37: User Wishlists**
*   Create `wishlists` PostgreSQL entity.
*   Implement backend endpoints and frontend UI for customers to manage wishlists.

### Section 13: Customer Engagement
**Session 38: Product Reviews**
*   Create `product_reviews` PostgreSQL entity.
*   Implement review creation logic (gated by verified purchase).
*   Add reviews UI to product detail pages and customer portal.

**Session 39: Loyalty Points System**
*   Implement loyalty points calculation (purchases, reviews, referrals) and redemption logic during checkout.

### Section 14: Affiliate & Partner Ecosystem
**Session 40: Affiliate Programme Foundation**
*   Create `affiliates` and `affiliate_conversions` PostgreSQL entities.
*   Implement cookie/link tracking endpoint (`/ref/:code`).

**Session 41: Affiliate Commissions & Payouts**
*   Implement logic to attribute purchases and calculate commissions based on tiers.
*   Build the Affiliate Dashboard for customers (`/account/affiliate`).

**Session 42: Affiliate Admin Management**
*   Build the Admin Affiliate Management UI (`/admin/affiliates`) for approving applications and processing payouts.

### Section 15: External Communications & Compliance
**Session 43: Notification System (Email & SSE)**
*   Setup Nodemailer with MJML templates.
*   Create `notifications` PostgreSQL entity.
*   Implement Server-Sent Events (SSE) endpoint for live in-app notifications.

**Session 44: Webhook Dispatcher**
*   Create `webhooks` PostgreSQL entity for third-party integrations.
*   Implement webhook dispatcher job queue to send out events (e.g., `order.paid`).

**Session 45: Audit Logging & GDPR Compliance**
*   Create `audit_logs` PostgreSQL table and interceptors for administrative actions.
*   Implement GDPR data export (ZIP) and data deletion endpoints.

---

## Phase 3: Deployment & Hardening

### Section 16: Enterprise Readiness
**Session 46: Integration & E2E Testing**
*   Develop comprehensive integration tests covering core critical paths (Generation -> Review -> Product -> Purchase).
*   Develop E2E tests for the frontend user journeys.

**Session 47: Observability Integration**
*   Finalize Prometheus metrics exposition.
*   Create Grafana dashboards for monitoring API latency, queue depth, DB connections, and error rates.

**Session 48: Production Deployment Preparation**
*   Create production Dockerfiles (multi-stage builds for NestJS and React).
*   Set up CI/CD pipeline configuration (e.g., GitHub Actions) for linting, testing, and building.
*   Configure environment secrets management.

**Session 49: Database Migrations & Rollout Strategy**
*   Finalize TypeORM migrations.
*   Document rolling deployment strategy and rollback procedures.

*(Note: Depending on development velocity, these 49 defined sessions may expand slightly up to ~60 sessions as complex features are broken down further during implementation.)*