# AI Content Factory — Agent Context File

> **For AI coding agents:** Read this entire file before writing any code, creating any file, or making any architectural decision. This document is the authoritative source of truth for how this codebase is structured, what conventions it follows, and how the system works end-to-end. Do not guess at patterns — if something is described here, follow it exactly. If something is not described here, ask before inventing a convention.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Repository Structure](#3-repository-structure)
4. [Technology Stack & Versions](#4-technology-stack--versions)
5. [NestJS Module Conventions](#5-nestjs-module-conventions)
6. [Database Conventions](#6-database-conventions)
7. [API Design Conventions](#7-api-design-conventions)
8. [Authentication & Authorisation](#8-authentication--authorisation)
9. [Job Queue System (BullMQ)](#9-job-queue-system-bullmq)
10. [AI Generation Pipeline](#10-ai-generation-pipeline)
11. [Automation Systems](#11-automation-systems)
12. [Testing Conventions](#12-testing-conventions)
13. [Error Handling Patterns](#13-error-handling-patterns)
14. [Environment & Configuration](#14-environment--configuration)
15. [Key Business Rules](#15-key-business-rules)
16. [Common Tasks & How to Do Them](#16-common-tasks--how-to-do-them)
17. [What NOT to Do](#17-what-not-to-do)

---

## 1. Project Overview

AI Content Factory is a **fully automated digital product generation and sales platform**. The system uses LLM APIs to continuously generate four types of digital content — AI prompt packs, poster generation prompts, YouTube scripts, and social media content packs — then categorises them, runs them through a human-in-the-loop review workflow, bundles them into downloadable product packs (PDF/ZIP), and sells them through a built-in marketplace.

The platform has two distinct user surfaces. The **admin/reviewer surface** is where internal staff manage the content pipeline, review AI-generated content, build product packs, manage orders, run analytics, and configure automation systems. The **customer surface** is a public marketplace where buyers discover, purchase, and download digital products.

Understanding this dual-surface nature is essential. Many modules serve both surfaces with different endpoint access levels, and a significant amount of code exists specifically to mediate between what the automation systems produce and what customers eventually see.

### The Core Loop (Memorise This)

```
Scheduler → LLM API → Raw Content → Quality Scoring → Deduplication Check
    → Safety Check → MongoDB Storage → Review Queue → Human Approval
    → Product Builder → PDF/ZIP → S3 Upload → PostgreSQL Product Record
    → Marketplace Listing → Customer Purchase → Stripe Webhook
    → Order Record → Signed Download URL → Customer Download
```

Every feature in this system either supports, extends, or monetises some part of this loop. When you are unsure where a piece of code belongs, trace it back to the loop.

---

## 2. System Architecture

### Services & Their Responsibilities

The backend is a single **NestJS monolith** (not microservices). Modules are separated by domain concern, not by deployment boundary. All modules run in the same Node.js process. This was a deliberate choice for Phase 1 and Phase 2 — do not refactor toward microservices without an explicit product decision.

```
┌──────────────────────────────────────────────────────────────────────┐
│  NestJS API Server (single process, multiple modules)                │
│                                                                      │
│  HTTP Layer → Guards → Interceptors → Controllers → Services         │
│                                            ↓                         │
│                              PostgreSQL (TypeORM)                    │
│                              MongoDB (Mongoose)                      │
│                              Redis (ioredis via BullMQ + cache)      │
│                              Elasticsearch                           │
│                              S3 (via AWS SDK v3)                     │
│                              Bull Queues (async work)                │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow Principle

There is a clear data ownership boundary between the two databases. **PostgreSQL owns business state** — anything with financial, legal, or identity significance lives there: users, orders, payments, products, approvals, coupons, affiliates. **MongoDB owns generated content** — anything that came out of an LLM API lives there: prompts, scripts, posters, social posts, generation logs, trend signals, auto-approval decisions. Never store LLM-generated raw content in PostgreSQL, and never store order/payment data in MongoDB. The content_embeddings table is the deliberate exception — it lives in PostgreSQL because pgvector is a PostgreSQL extension.

---

## 3. Repository Structure

```
/
├── src/
│   ├── main.ts                         # Bootstrap: Swagger, global pipes, CORS, Helmet
│   ├── app.module.ts                   # Root module: imports all feature modules
│   │
│   ├── config/
│   │   ├── database.config.ts          # TypeORM + Mongoose factory configs
│   │   ├── jwt.config.ts               # JWT options from env
│   │   ├── storage.config.ts           # S3/Cloudinary config
│   │   ├── elasticsearch.config.ts     # ES client factory
│   │   └── bull.config.ts              # BullMQ Redis connection
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts      # @Roles(Role.ADMIN, Role.REVIEWER)
│   │   │   ├── public.decorator.ts     # @Public() — bypasses JwtAuthGuard
│   │   │   └── current-user.decorator.ts  # @CurrentUser() — extracts JWT payload
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts  # Formats all errors as RFC 7807
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts       # Applied globally; @Public() bypasses it
│   │   │   └── roles.guard.ts          # Applied per-route via @Roles()
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts  # Request/response logging with requestId
│   │   │   └── transform.interceptor.ts  # Wraps all success responses: { data, meta }
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts      # Global ValidationPipe (whitelist, forbidNonWhitelisted)
│   │   └── dto/
│   │       └── pagination.dto.ts       # PaginationDto: page, limit, sort, order
│   │
│   └── modules/
│       ├── auth/
│       ├── users/
│       ├── ai-generator/
│       ├── categorisation/
│       ├── prompts/
│       ├── scripts/
│       ├── posters/
│       ├── social/
│       ├── approvals/
│       ├── products/
│       ├── product-builder/
│       ├── orders/
│       ├── downloads/
│       ├── dashboard/
│       ├── automation/
│       ├── storage/
│       ├── search/
│       ├── coupons/
│       ├── bundles/
│       ├── wishlist/
│       ├── reviews/
│       ├── affiliates/
│       ├── notifications/
│       ├── webhooks/
│       ├── analytics/
│       └── audit/
│
├── test/
│   ├── unit/                           # Jest unit tests (*.spec.ts)
│   └── e2e/                            # Supertest e2e tests (*.e2e-spec.ts)
│
├── migrations/                         # TypeORM migration files (auto-generated + hand-edited)
├── seeds/                              # Development seed data scripts
├── scripts/                            # One-off utility scripts (never imported by app code)
├── .env.example                        # Template for all required env vars
├── docker-compose.yml                  # Local dev: PG, Mongo, Redis, ES
├── docker-compose.prod.yml             # Production overrides
└── Dockerfile                          # Multi-stage: builder + production
```

### Module Internal Structure

Every module follows this exact internal layout. Do not deviate from it:

```
modules/example/
├── example.module.ts           # Imports, providers, exports declarations
├── example.controller.ts       # HTTP layer only — no business logic
├── example.service.ts          # Business logic — the main service
├── example.repository.ts       # Data access layer (TypeORM or Mongoose queries)
├── dto/
│   ├── create-example.dto.ts
│   ├── update-example.dto.ts
│   └── example-response.dto.ts
├── entities/
│   └── example.entity.ts       # TypeORM entity (PostgreSQL modules)
├── schemas/
│   └── example.schema.ts       # Mongoose schema (MongoDB modules)
├── interfaces/
│   └── example.interface.ts    # TypeScript interfaces specific to this module
└── example.spec.ts             # Unit tests for example.service.ts
```

---

## 4. Technology Stack & Versions

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Runtime | Node.js | ≥ 20 LTS | Use `engines` field in package.json |
| Language | TypeScript | ≥ 5.x | `strict: true` in tsconfig. No exceptions. |
| Framework | NestJS | ≥ 10.x | `@nestjs/cli` for code generation |
| Relational DB | PostgreSQL | ≥ 16 | pgvector extension required |
| ORM | TypeORM | latest | Used only for PostgreSQL |
| Document DB | MongoDB | ≥ 7.x | Atlas in production |
| ODM | Mongoose | latest | Used only for MongoDB |
| Cache / Queue broker | Redis | ≥ 7.x | Single Redis instance serves both |
| Job Queue | BullMQ | latest | `@nestjs/bull` wrapper |
| Search | Elasticsearch | 8.x | `@elastic/elasticsearch` client |
| Vector search | pgvector | latest | PostgreSQL extension; `vector` column type |
| Auth | JWT + Passport.js | latest | `@nestjs/jwt`, `@nestjs/passport` |
| Validation | class-validator + class-transformer | latest | Applied globally |
| File generation | PDFKit + Archiver | latest | Product packs |
| Storage | AWS SDK v3 (`@aws-sdk/client-s3`) | latest | S3 pre-signed URLs |
| Email | Nodemailer + MJML | latest | `@nestjs-modules/mailer` |
| Payments | Stripe Node SDK | latest | Use `stripe` npm package |
| 2FA | otplib | latest | TOTP generation/verification |
| Scheduling | `@nestjs/schedule` | latest | Cron decorators |
| API docs | `@nestjs/swagger` | latest | Auto-generated from decorators |
| Testing | Jest + Supertest | latest | Unit and e2e |
| Linting | ESLint + Prettier | latest | Config in `.eslintrc.js` and `.prettierrc` |

---

## 5. NestJS Module Conventions

### Controllers

Controllers handle HTTP concerns only. They receive a request, call a service method, and return the result. No business logic, no database queries, no conditional branching based on data — that all belongs in the service.

```typescript
// CORRECT — controller delegates immediately to service
@Post()
@Roles(Role.ADMIN)
async createCoupon(@Body() dto: CreateCouponDto, @CurrentUser() user: JwtPayload) {
  return this.couponsService.create(dto, user.sub);
}

// WRONG — business logic in controller
@Post()
async createCoupon(@Body() dto: CreateCouponDto) {
  if (dto.value > 100 && dto.type === 'percentage') {  // ← belongs in service
    throw new BadRequestException('...');
  }
  return this.couponsService.create(dto);
}
```

### Services

Services own all business logic, validation of business rules, and coordination between repositories. Services may call other services (inject them as dependencies). Services should not know about HTTP — they never throw `HttpException` directly; they throw domain exceptions which the global filter converts.

Actually in this codebase we do use NestJS HTTP exceptions in services for simplicity, because NestJS is tightly coupled to the HTTP layer by design. Use `BadRequestException`, `NotFoundException`, `ConflictException`, `ForbiddenException` from `@nestjs/common` where appropriate. The global exception filter will format them correctly.

### DTOs

Every DTO must use `class-validator` decorators. Every property must be explicitly typed. Use `@ApiProperty()` from `@nestjs/swagger` on every property so Swagger stays current automatically.

```typescript
export class CreateCouponDto {
  @ApiProperty({ example: 'LAUNCH20', description: 'Unique coupon code (auto-uppercased)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }) => value.toUpperCase().trim())
  code: string;

  @ApiProperty({ enum: CouponType })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({ example: 20.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  value: number;
}
```

### Dependency Injection

Use constructor injection. Never use property injection (`@Inject()` on a class property). If a service has more than six injected dependencies, that is a code smell — consider whether it needs to be split.

### Response Format

The `TransformInterceptor` wraps all successful responses. Do not return raw entities from controllers — return response DTOs or plain objects. The final response shape is always:

```json
{
  "data": { ... },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

For paginated responses, `data` is the items array and `meta` includes `total`, `page`, `limit`, and `totalPages`.

---

## 6. Database Conventions

### PostgreSQL (TypeORM)

**Entity naming:** Classes are singular PascalCase (`Product`, `Order`, `Coupon`). Table names are plural snake_case (`products`, `orders`, `coupons`). Never use TypeORM's auto-pluralisation — always set the table name explicitly with `@Entity('table_name')`.

**Primary keys:** Always UUID, always generated server-side with `DEFAULT gen_random_uuid()`. Use TypeORM's `@PrimaryGeneratedColumn('uuid')`.

**Timestamps:** Every entity has `created_at` and `updated_at`. Use `@CreateDateColumn()` and `@UpdateDateColumn()`. Column type is `timestamptz` (timezone-aware). Never use `timestamp without time zone`.

**Soft deletes:** All user-facing entities use soft deletes via `@DeleteDateColumn() deleted_at: Date`. Enable with `@Entity({ ... })` and use TypeORM's `softDelete()` / `softRemove()` methods. Hard-deletes are only used in GDPR erasure flows.

**Migrations:** Never use `synchronize: true` in any environment except a fresh local dev setup with `NODE_ENV=development`. All schema changes go through migration files generated with `typeorm migration:generate`. Review generated migration files before running them — TypeORM sometimes generates destructive changes for column renames.

**Indexes:** Declare all indexes in the entity file using `@Index()`. Do not create indexes manually in migrations unless they need special configuration (like the pgvector ivfflat index, which must be created in a raw migration).

```typescript
// pgvector index — must be raw SQL in a migration:
await queryRunner.query(`
  CREATE INDEX ON content_embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
`);
```

### MongoDB (Mongoose)

**Schema naming:** Schema files export both the schema and the document interface. Class names follow the pattern `PromptDocument`, `ScriptDocument`, etc.

**`_id` handling:** MongoDB ObjectIds are accessed as `_id.toString()` when passing to PostgreSQL foreign keys (the `content_id` VARCHAR columns in the approvals and content_embeddings tables).

**Status fields:** All content documents have a `status` field. The valid values are `pending`, `approved`, `auto_approved`, `rejected`, `auto_rejected`, `safety_rejected`, `archived`, `in_product`. The content is only eligible for product inclusion when status is `approved` or `auto_approved`.

**Timestamps:** Use Mongoose's `{ timestamps: true }` option on every schema. This adds `createdAt` and `updatedAt` automatically (camelCase, unlike PG which uses snake_case — this is intentional, following each database's native convention).

**Batch tracking:** Every generated content document has a `batchId` field (string, UUID format). This links all items generated in the same automation run. Always pass and store batchId — it is critical for bulk review operations and debugging.

### Redis

Redis serves two distinct purposes: BullMQ job queues (see Section 9) and application caching. Use separate key prefixes to avoid collisions:

- `cache:` prefix for application cache (dashboard stats, generation priority matrix, exchange rates)
- `cart:` prefix for shopping cart sessions
- `sess:` prefix for rate limiter counters
- `sse:` prefix for SSE channel management
- BullMQ manages its own keys with `bull:` prefix automatically

Cache TTLs: dashboard stats → 5 minutes, exchange rates → 6 hours, generation priority matrix → 1 hour, cart sessions → 7 days.

---

## 7. API Design Conventions

### URL Structure

All endpoints are prefixed with `/api/v1`. The version prefix is set in `main.ts` via `app.setGlobalPrefix('api/v1')`. Do not hardcode the prefix in controller decorators — it is applied globally.

Resource URLs are plural nouns: `/products`, `/orders`, `/coupons`. Actions that are not CRUD are expressed as sub-resources: `/orders/:id/refund`, `/approvals/:id/approve`, `/products/:id/publish`. Never use verbs in the resource path itself (`/createProduct` is wrong; `POST /products` is correct).

### HTTP Methods & Status Codes

Follow REST semantics strictly:
- `GET` — read, never mutates state
- `POST` — create a new resource (returns 201) or trigger an action (returns 200)
- `PATCH` — partial update (returns 200 with updated resource)
- `PUT` — full replacement (rarely used in this codebase; prefer PATCH)
- `DELETE` — remove (returns 204 No Content)

### Pagination

All list endpoints accept `?page=1&limit=20&sort=created_at&order=DESC`. Extend `PaginationDto` for endpoint-specific filters. Never return unbounded result sets — always paginate, even if the caller does not request it. Default limit is 20, maximum enforced limit is 100.

### Filtering

Pass filters as query parameters. Use `@Query()` with a typed filter DTO. Complex filters (arrays) use repeated params: `?tags=art&tags=cinematic`.

---

## 8. Authentication & Authorisation

### How It Works

The `JwtAuthGuard` is applied **globally** in `app.module.ts` via `APP_GUARD`. This means every route requires a valid JWT by default. To make a route public, apply the `@Public()` decorator — this sets metadata that `JwtAuthGuard` reads to skip verification.

After JWT verification, the `RolesGuard` (also global) checks the `@Roles()` decorator on the route. If no `@Roles()` decorator is present, any authenticated user can access the route.

### Role Hierarchy

```
super_admin > admin > reviewer > customer
```

The hierarchy is not automatically enforced — `@Roles(Role.REVIEWER)` means only `reviewer` role, not "reviewer and above." To allow multiple roles, list them explicitly: `@Roles(Role.ADMIN, Role.REVIEWER, Role.SUPER_ADMIN)`. There is a `RolesHierarchy` utility in `common/utils/roles.util.ts` that accepts a minimum role and expands it upward — use this for routes that should be accessible to a role and all roles above it.

```typescript
// Allows reviewer, admin, and super_admin:
@Roles(...RolesHierarchy.atLeast(Role.REVIEWER))
```

### JWT Payload Shape

```typescript
interface JwtPayload {
  sub: string;      // user UUID
  email: string;
  role: Role;
  iat: number;
  exp: number;
}
```

Access this in controllers and services via the `@CurrentUser()` decorator, which extracts the payload from `request.user` (populated by Passport after JWT verification).

### 2FA Flow

When a user with 2FA enabled logs in with valid email/password, the auth service returns a `{ requires2fa: true, tempToken: '...' }` response instead of the normal token pair. The `tempToken` is a short-lived JWT (5-minute expiry) with `{ sub, type: 'pre_2fa' }` payload. The client must POST this token plus a TOTP code to `/auth/2fa/verify`. Only on successful TOTP verification is the full access + refresh token pair issued. Any route that checks for `JwtAuthGuard` will reject the `pre_2fa` token because the token type check happens inside `JwtStrategy.validate()`.

---

## 9. Job Queue System (BullMQ)

### Why Everything Heavy Goes Through a Queue

Long-running operations (PDF generation, LLM API calls, embedding computation, email sending, S3 uploads) must never block HTTP responses. Even if a request triggers one of these operations, the HTTP response should return immediately (typically with a job ID or a status indicating the operation was queued), and the actual work happens asynchronously.

### Queue Definitions

| Queue | Concurrency | Purpose |
|---|---|---|
| `ai-generation` | 3 | LLM API calls for all content types |
| `content-embedding` | 5 | pgvector embedding computation |
| `product-builder` | 2 | PDF generation, ZIP creation, S3 upload |
| `repurposing` | 4 | Content repurposing engine jobs |
| `email` | 10 | All outbound emails |
| `seo-generation` | 5 | Product SEO metadata generation |
| `trend-ingestion` | 2 | External trend API data fetching |
| `pricing-engine` | 1 | Price evaluation (single worker ensures no race conditions) |
| `notifications` | 10 | In-app notification delivery |
| `webhook-dispatch` | 8 | Outbound webhook event dispatch |

### How to Add a New Job

Define the job data interface, add the job type to the queue's union type, create a processor method decorated with `@Process('job-name')` inside the queue's processor class, and add the job-adding method to the relevant service. Keep processor logic thin — call a service method, do not inline complex business logic in the processor.

```typescript
// In automation.processor.ts
@Process('generate-repurposed-content')
async handleRepurposing(job: Job<RepurposingJobData>): Promise<void> {
  const { sourceContentId, contentType, targetTypes } = job.data;
  await this.repurposingService.repurpose(sourceContentId, contentType, targetTypes);
}
```

### Error Handling in Queues

BullMQ retries failed jobs according to the queue's `defaultJobOptions`. Do not catch errors inside processor methods unless you need to handle a specific case — let errors propagate so BullMQ's retry mechanism engages. Log errors with the job ID and data so failed jobs are debuggable from the Bull Board UI at `/admin/queues`.

---

## 10. AI Generation Pipeline

### The LLMClientService

All LLM API calls go through `LLMClientService` in the `ai-generator` module. Never call OpenAI or Anthropic SDKs directly from other services — always go through `LLMClientService`. This abstraction handles: provider selection (configurable per content type), fallback logic (if primary provider fails, switch to fallback), token counting, cost estimation, and rate limiting.

The service exposes a single primary method:

```typescript
async generate(params: GenerateParams): Promise<GenerateResult> {
  // params: { provider, model, systemPrompt, userPrompt, maxTokens, temperature }
  // result: { content: string, tokensUsed: number, model: string, provider: string, costUsd: number }
}
```

### Prompt Construction

System prompts are stored as template files in `src/modules/ai-generator/prompts/`. They are plain text files with `{{variable}}` placeholders replaced at runtime. Keep prompts in files, not hardcoded in TypeScript strings — this makes them easy to iterate on without code changes.

The `TrendIntegrationService` is responsible for injecting trend hints into prompts. It is called by the generation service before constructing the final prompt, and it returns an array of topic strings that get appended to the user prompt as: `Focus especially on these trending topics: [topic1], [topic2], [topic3].`

### The Safety Check

After receiving LLM output and before saving anything to MongoDB, `ContentSafetyService.check(text)` is called. This calls the OpenAI Moderation API. If any category scores above its configured threshold, the method throws a `ContentSafetyException`, which the generation service catches and logs as a `safety_rejected` item. The generation loop continues with the next item — a safety rejection does not abort the batch.

### The Quality Score

After the safety check passes, `CategorisationService.scoreQuality(text, contentType)` returns a 0–100 score. Items below the configured `qualityThreshold` (default 75, adaptive per Section 2.12 of the PRD) are saved with `status: 'rejected'` and the rejection reason `'quality_below_threshold'`. They are also not embedded (to save cost) and are queued for the auto-regeneration system.

### Batch ID

Every generation run creates a UUID batch ID at the start. Every content document, every generation log entry, and every auto-approval decision record for that run shares this batch ID. This is the primary debugging tool — if something looks wrong in a batch, search by batch ID across all collections to see the complete picture.

---

## 11. Automation Systems

There are twelve automation systems. When modifying any of them, understand that several have dependencies on each other's outputs:

```
Trend Intelligence Engine  ──→  Generation Scheduler (influences what is generated)
        ↓
AI Generation Pipeline
        ↓
Safety Check → (rejected) → [discarded, logged]
        ↓
Quality Scoring → (below threshold) → Auto-Regeneration Queue
        ↓
Content Deduplication → (duplicate) → [discarded, logged]
        ↓
Smart Auto-Approval Engine → (auto-approved or auto-rejected or queued for human review)
        ↓
Content Repurposing Engine → (for high-quality approved items) → [new items, same pipeline]
        ↓
Performance Feedback Loop → (reads sales data) → updates Generation Priority Matrix
        ↓
Inventory & Lifecycle Management → (reads product sales) → [archive, sunset, feature]
        ↓
SEO Metadata Generation → (fires on product.published) → updates product SEO fields
        ↓
Dynamic Pricing Engine → (reads demand signals) → [recommends or applies price changes]
        ↓
Automated Email Campaign Triggers → (reads user events) → [queues emails]
        ↓
Quality Evolution Tracking → (reads approval + sales data) → [adjusts thresholds over time]
```

### Cron Schedule

All cron jobs are defined in `src/modules/automation/automation.scheduler.ts`. The cron expressions use UTC. Do not define crons anywhere else — centralise all scheduled work here for discoverability. Each cron method should be a thin wrapper that adds a job to the appropriate Bull queue rather than doing work inline.

---

## 12. Testing Conventions

### Unit Tests

Unit tests live alongside the file they test: `example.service.spec.ts` next to `example.service.ts`. Test the service class directly. Mock all dependencies using Jest's `jest.fn()` and NestJS's `Test.createTestingModule` with mock providers. Do not spin up databases or external services in unit tests.

Coverage target is 85% branch coverage per module. Run `npm run test:cov` to check. The CI pipeline will fail if coverage drops below this threshold.

```typescript
describe('CouponsService', () => {
  let service: CouponsService;
  let mockRepo: jest.Mocked<CouponsRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CouponsService,
        { provide: CouponsRepository, useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get(CouponsService);
    mockRepo = module.get(CouponsRepository);
  });

  it('should throw ConflictException for duplicate coupon code', async () => {
    mockRepo.findByCode.mockResolvedValue({ id: 'existing' } as any);
    await expect(service.create({ code: 'DUPE', ... })).rejects.toThrow(ConflictException);
  });
});
```

### E2E Tests

E2E tests live in `test/e2e/` and use Supertest with a real test database (seeded before each test suite, cleaned after). E2E tests are slower — run them with `npm run test:e2e`. Each e2e file covers one feature flow end-to-end: authentication, checkout, generation → review → publish, etc. E2E tests should not mock external APIs — use environment-configurable test doubles (test Stripe keys, a local mock LLM API server if needed).

---

## 13. Error Handling Patterns

### The Global Exception Filter

`GlobalExceptionFilter` catches all exceptions and formats them as RFC 7807 Problem Details:

```json
{
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Coupon LAUNCH20 has reached its usage limit",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "path": "/api/v1/orders/checkout",
  "requestId": "req_abc123"
}
```

Never send raw error objects to the client. Never expose stack traces in production (`NODE_ENV=production` suppresses them in the filter).

### Domain vs. Infrastructure Errors

Business rule violations throw NestJS HTTP exceptions from services. Infrastructure failures (database down, S3 unreachable, LLM API timeout) should be caught at the service boundary, logged with full context, and either re-thrown as a 502/503 HTTP exception or handled gracefully (e.g., falling back to a cached value for non-critical operations).

### Async Error Propagation in Queues

Bull processor methods that throw will cause the job to fail. BullMQ captures the error, stores it on the job, and handles retries. After max retries, the job moves to the `failed` state. Monitor the `failed` queues regularly — use the Bull Board at `/admin/queues` or check the `automation.alert` webhook event.

---

## 14. Environment & Configuration

### Loading Config

Use `@nestjs/config` with the `ConfigService`. Never access `process.env` directly in services or modules — always inject `ConfigService` and call `configService.get<string>('VARIABLE_NAME')`. Config validation happens at startup via a Joi schema in `config/validation.schema.ts` — if a required env var is missing, the application refuses to start.

### Environment Files

Use `.env` for local development (gitignored). Use `.env.example` as the template (committed). In staging and production, environment variables are injected by the deployment system (AWS ECS task definitions / GitHub Actions secrets) — there are no `.env` files in deployed environments.

### Secrets

API keys, JWT secrets, database passwords, and Stripe keys are never hardcoded. In production they come from AWS Secrets Manager. The deployment pipeline fetches them at startup and injects them as environment variables. Do not add secrets to any configuration file that is committed to the repository.

---

## 15. Key Business Rules

These are rules that have caused bugs when forgotten. Internalise them.

**Content eligibility for products:** A content item is only eligible to be included in a product pack if its status is `approved` or `auto_approved` AND `inProduct` is `false`. Items with any other status, or that are already `inProduct: true`, must be excluded from product builder selection queries.

**One approved item, one product:** Once a content item is included in a published product, its `inProduct` flag is set to `true` in MongoDB. It cannot be included in another product. This prevents customers from buying two different packs that contain identical content.

**Download entitlement gate:** The download signed URL endpoint must verify that the requesting user has a paid order containing the requested product before generating the URL. Never generate a signed URL based solely on product ID without order verification.

**Maximum downloads per purchase:** Five downloads per order-product combination. The download count is tracked in the PostgreSQL `downloads` table. The sixth attempt must return 403 with a message directing the user to repurchase.

**Affiliate self-referral prevention:** In `ReferralService.attributeOrder()`, always compare the purchasing user's ID with the affiliate's user ID before creating a conversion record. If they match, skip attribution silently (do not error).

**Coupon stacking:** Only one coupon can be applied per order. Attempting to apply a second coupon while one is already in the cart should replace the first, not stack them.

**Commission hold period:** Affiliate commissions must not be moved from `pending` to `approved` status until 30 days after the associated order's `paid_at` timestamp. Do not approve commissions eagerly.

**Refund reversal:** When an order is refunded, any associated affiliate conversion must be reversed (status → `reversed`) and the affiliate's `pending_balance` decremented by the commission amount. This must happen in a database transaction with the order refund — partial application is not acceptable.

**Price floor:** The Dynamic Pricing Engine must never set a product price below `product.price_floor_usd`. If no floor is set on the product, use the system-wide floor from config (default $0.99). Any code path that updates a product price must validate against this floor.

**2FA enforcement for staff:** Users with `role` of `admin`, `reviewer`, or `super_admin` who have not enabled 2FA should be redirected to 2FA setup on every login until they complete it. The `JwtStrategy.validate()` method checks the `twoFactorEnabled` flag and sets a `requires_2fa_setup` flag on the request when applicable. The frontend handles the redirect.

---

## 16. Common Tasks & How to Do Them

### Adding a New API Endpoint

1. Add the route to the controller with `@ApiOperation()`, `@ApiResponse()`, and the correct auth decorators.
2. Add the business logic to the service.
3. Add any required data access methods to the repository.
4. Create or extend DTOs with full class-validator decorators and `@ApiProperty()` annotations.
5. Write a unit test for the new service method.
6. Write an e2e test for the happy path and at least one error case.
7. Run `npm run swagger:generate` to update the OpenAPI JSON file — commit this alongside the code change.

### Adding a New Bull Queue

1. Define the queue name constant in `src/common/constants/queues.constant.ts`.
2. Register the queue in `automation.module.ts` (or the relevant module) using `BullModule.registerQueue({ name: QUEUE_NAME })`.
3. Create a processor class with `@Processor(QUEUE_NAME)` decorator.
4. Import `BullModule.registerQueue` in any module that needs to add jobs to this queue.
5. Add the queue to the Bull Board configuration in `app.module.ts`.
6. Add an entry to the queues table in this file's Section 9.

### Adding a New Webhook Event

1. Add the event type string to the `WebhookEventType` enum in `src/modules/webhooks/enums/webhook-event-type.enum.ts`.
2. Define the event payload interface in `src/modules/webhooks/interfaces/webhook-payloads.interface.ts`.
3. Call `this.webhooksService.dispatch(WebhookEventType.YOUR_EVENT, payload)` from the service where the event originates.
4. Add the event type to the webhook creation endpoint's validation (the `events` field accepts an array of `WebhookEventType`).
5. Add the event to the documentation table in Section 11.1 of the PRD.

### Adding a New Email Template

1. Create the `.mjml` template file in `src/modules/notifications/templates/`.
2. Define the context interface (the typed variables the template receives) in `src/modules/notifications/interfaces/email-contexts.interface.ts`.
3. Add the send method to `EmailService` with the correct context type.
4. Add the trigger condition to the appropriate service (e.g., in `OrdersService.markAsPaid()` for order confirmation).
5. Add the template to the table in PRD Section 8.2.

### Running a Database Migration

```bash
# Generate migration from entity changes:
npm run migration:generate -- src/migrations/AddLoyaltyPointsColumn

# Run pending migrations:
npm run migration:run

# Revert last migration:
npm run migration:revert
```

Never run `migration:run` directly against production. Use the deployment pipeline which runs migrations as part of the deployment step, after health checking the new API version but before routing traffic to it.

---

## 17. What NOT to Do

These are patterns that are explicitly prohibited in this codebase. If you find yourself about to do one of these, stop and find the correct approach instead.

**Do not use `synchronize: true` in TypeORM config** in any environment other than a clean local dev setup. It can and will drop columns or tables if it detects a mismatch.

**Do not store LLM output directly in PostgreSQL.** All generated content (prompts, scripts, posters, social posts) belongs in MongoDB. The PostgreSQL `approvals` table stores references to content (via `content_id` VARCHAR) but never the content itself.

**Do not call OpenAI or Anthropic SDKs directly.** Always go through `LLMClientService`. This is the only place that handles provider failover, cost tracking, and rate limiting.

**Do not generate signed S3 URLs without verifying purchase entitlement.** Every call to `StorageService.generateSignedUrl()` for a private product file must be preceded by an `OrdersRepository.verifyPurchase(userId, productId)` check.

**Do not use `@InjectRepository()` directly in controllers.** Controllers talk to services. Services talk to repositories. The controller layer must never touch the database layer directly.

**Do not write migrations by hand for anything other than raw SQL operations** (like the pgvector index). Always use `migration:generate` from your entity definitions, then review and commit the generated file.

**Do not add new environment variables without also adding them to `.env.example`, the Joi validation schema in `config/validation.schema.ts`, and the appendix of the relevant PRD document.**

**Do not use `console.log` for application logging.** Use the injected `Logger` from `@nestjs/common`. Every service that needs logging should declare `private readonly logger = new Logger(ServiceName.name)` and use `this.logger.log()`, `this.logger.warn()`, `this.logger.error()`.

**Do not put cron jobs anywhere except `automation.scheduler.ts`.** All scheduled work is centralised there. A cron method in any other file will be missed during scheduling audits and monitoring.

**Do not commit API keys, secrets, or credentials** in any form — not in code, not in comments, not in test fixtures. Use `.env` locally and AWS Secrets Manager in deployed environments.

**Do not apply price changes without logging them to `price_history`.** Every price change, regardless of source (admin manual, dynamic pricing engine, promo event), must create a row in the `price_history` PostgreSQL table before the product price is updated.

---

*This file should be updated whenever a new module is added, a convention is changed, a business rule is clarified, or a new "what not to do" is discovered. It is a living document.*

*Last updated to reflect: PRD v1.0.0 + PRD Supplement v2.0.0*
