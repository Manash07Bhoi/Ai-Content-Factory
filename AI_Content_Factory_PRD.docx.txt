AI Content Factory — Product Requirements Document  |  CONFIDENTIAL


PRODUCT REQUIREMENTS DOCUMENT
AI Content Factory
Automated Digital Product Generation & Sales Platform




Document Version
	v1.0.0 — Production Release
	Status
	Ready for Engineering
	Owner
	Product Team
	Classification
	Internal — Confidential
	Last Updated
	2026
	Stack
	Node.js · NestJS · PostgreSQL · MongoDB · TypeScript
	

AI Content Factory — All Rights Reserved
________________


Table of Contents




________________


1. Executive Summary
AI Content Factory is a fully automated, end-to-end digital-product generation and sales platform. It harnesses large language model APIs to continuously produce high-demand digital assets — AI prompt packs, poster generation prompts, YouTube scripts, and social media content bundles — then packages, reviews, and publishes them to a built-in storefront without requiring constant manual effort.
The platform operates on a closed-loop automation cycle: scheduled jobs generate raw AI content, a categorisation engine tags and organises each item, a human-in-the-loop review dashboard allows moderators to approve or reject content before it is bundled into downloadable product packs, and an integrated marketplace exposes those packs to paying customers.


1.1 Business Objectives
* Generate a self-sustaining catalogue of digital products with minimal manual input.
* Reduce time-to-market for each new product pack to under 24 hours from generation to store listing.
* Provide a scalable review workflow that supports multiple reviewer roles.
* Enable monetisation through a built-in checkout, order management, and secure file delivery system.
* Maintain full audit trails of all generated content, approvals, and sales.


1.2 Success Metrics
KPI
	Target
	Measurement Frequency
	Content items generated / day
	≥ 200
	Daily
	Review-to-publish cycle time
	≤ 24 hours
	Per batch
	Product approval rate
	≥ 80 %
	Weekly
	Store conversion rate
	≥ 2.5 %
	Monthly
	System uptime
	99.9 %
	Monthly
	API response time (p95)
	≤ 300 ms
	Continuous
	Automated test coverage
	≥ 85 %
	Per deployment
	

________________


2. Product Overview & Vision
The platform is built around a factory metaphor: raw material (AI-generated text) enters one end of the conveyor, travels through quality control (review), is packaged (product builder), and exits as a finished good (published product) available for purchase.


2.1 Product Types
Product Type
	Internal Key
	Description
	Typical Pack Size
	AI Prompt Pack
	prompt_pack
	Curated prompts for image generators (Midjourney, DALL·E, Stable Diffusion)
	50 prompts
	Poster Pack
	poster_pack
	Prompt-driven poster designs with theme tags
	10 posters
	Script Bundle
	script_pack
	YouTube/short-form video scripts with hooks, body & CTA
	5 scripts
	Social Media Pack
	social_pack
	Platform-specific captions, hashtags & content calendars
	30 posts
	

2.2 High-Level System Workflow
Scheduler (cron)  →  AI Generator Module  →  Categorisation Service
      ↓                                              ↓
MongoDB Storage  ←────────────────────────  Content Tagger
      ↓
Review Dashboard  →  Admin Approve/Reject  →  Product Builder
      ↓                                              ↓
Product Pack (PDF/ZIP)  →  Cloud Storage   →  PostgreSQL Products Table
      ↓
Marketplace Listing  →  Customer Purchase  →  Secure Download


________________


3. Stakeholders & User Personas
3.1 Roles Overview
Role
	Auth Level
	Primary Responsibilities
	Super Admin
	Level 5
	Full system access, user management, API key configuration, analytics
	Admin
	Level 4
	Content generation triggers, approval overrides, product publishing, order management
	Reviewer
	Level 3
	Review queue management, approve/reject AI content, edit content before approval
	Customer
	Level 1
	Browse marketplace, purchase products, download files, manage orders
	Public (Guest)
	Level 0
	Browse published products, view product previews
	

3.2 Persona Profiles
Admin — Alex
Alex oversees the entire content production pipeline. He triggers generation batches, monitors the automation dashboard, reviews aggregate statistics, and publishes approved product packs to the storefront. Alex values clear progress indicators and one-click batch actions.
Reviewer — Priya
Priya is a content quality specialist. She works through the review queue daily, using the preview panel to evaluate AI-generated items. She can edit prompts or captions before approving, and she flags anything that violates content guidelines for admin escalation.
Customer — Jordan
Jordan is a digital creator who purchases prompt packs and social media bundles. Jordan values fast checkout, instant downloads, and clear licensing terms. Jordan may also browse the marketplace as a guest before registering.


________________


4. Technology Architecture
4.1 Tech Stack
Layer
	Technology
	Version / Notes
	Runtime
	Node.js
	≥ 20 LTS
	Language
	TypeScript
	≥ 5.x — strict mode enabled
	Framework
	NestJS
	≥ 10.x — modular architecture
	Relational DB
	PostgreSQL
	≥ 16 — business data
	Document DB
	MongoDB
	≥ 7.x — AI content store
	ORM / ODM
	TypeORM (PG) + Mongoose (Mongo)
	Latest stable
	Authentication
	JWT + Passport.js
	Access & Refresh token strategy
	Task Scheduling
	@nestjs/schedule (node-cron)
	Cron-based automation
	File Generation
	PDFKit + Archiver (ZIP)
	Product pack creation
	Cloud Storage
	AWS S3 / Cloudinary
	PDF, ZIP, image assets
	Mailer
	@nestjs-modules/mailer + Nodemailer
	Order confirmations
	Payment
	Stripe API
	Checkout, webhooks, refunds
	Validation
	class-validator + class-transformer
	All DTOs
	API Docs
	Swagger / OpenAPI 3.0
	Auto-generated via @nestjs/swagger
	Testing
	Jest + Supertest
	Unit & e2e coverage
	Containerisation
	Docker + Docker Compose
	Dev & production
	CI/CD
	GitHub Actions
	Automated test & deploy pipeline
	Frontend
	HTML5 / CSS3 / TypeScript
	Vanilla or lightweight framework
	

4.2 System Architecture Diagram
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│   Browser (Admin Dashboard)   Browser (Marketplace)     │
└────────────────────┬────────────────────────────────────┘
                     │  HTTPS / REST API
┌────────────────────▼────────────────────────────────────┐
│                   API GATEWAY (NestJS)                   │
│  Auth  │  AI-Gen  │  Products  │  Orders  │  Dashboard  │
└──┬──────────┬──────────────────────┬────────────────────┘
   │          │                       │
┌──▼──┐  ┌────▼───────┐  ┌───────────▼──────────────┐
│ PG  │  │  MongoDB   │  │   Cloud Storage (S3)     │
│     │  │            │  │   PDFs / ZIPs / Images   │
└─────┘  └────────────┘  └──────────────────────────┘


________________


5. Database Design
5.1 PostgreSQL — Relational Database
PostgreSQL manages all structured business data including users, products, orders, payments, and audit records. All tables use UUID primary keys generated server-side. Timestamps use timezone-aware TIMESTAMPTZ columns. Soft deletes are implemented via a deleted_at nullable column.


5.1.1 Table: users
Column
	Type
	Constraints
	Description
	id
	UUID
	PK, DEFAULT gen_random_uuid()
	Unique user identifier
	email
	VARCHAR(255)
	NOT NULL, UNIQUE
	Login email address
	password_hash
	VARCHAR(255)
	NOT NULL
	bcrypt hashed password (cost 12)
	full_name
	VARCHAR(200)
	NOT NULL
	Display name
	role
	ENUM
	NOT NULL, DEFAULT 'customer'
	One of: super_admin, admin, reviewer, customer
	is_active
	BOOLEAN
	NOT NULL, DEFAULT TRUE
	Account enabled flag
	email_verified
	BOOLEAN
	NOT NULL, DEFAULT FALSE
	Email verification status
	avatar_url
	TEXT
	NULLABLE
	Profile picture URL
	last_login_at
	TIMESTAMPTZ
	NULLABLE
	Last successful login timestamp
	refresh_token_hash
	TEXT
	NULLABLE
	Hashed refresh JWT
	created_at
	TIMESTAMPTZ
	NOT NULL, DEFAULT NOW()
	Row creation time
	updated_at
	TIMESTAMPTZ
	NOT NULL, DEFAULT NOW()
	Last modification time
	deleted_at
	TIMESTAMPTZ
	NULLABLE
	Soft delete timestamp
	

Indexes: UNIQUE(email), INDEX(role), INDEX(is_active), INDEX(created_at DESC).


5.1.2 Table: products
Column
	Type
	Constraints
	Description
	id
	UUID
	PK
	Unique product identifier
	title
	VARCHAR(300)
	NOT NULL
	Product display title
	slug
	VARCHAR(320)
	NOT NULL, UNIQUE
	URL-friendly identifier
	description
	TEXT
	NOT NULL
	Full product description (markdown)
	short_description
	VARCHAR(500)
	NULLABLE
	Marketplace card excerpt
	product_type
	ENUM
	NOT NULL
	prompt_pack | poster_pack | script_pack | social_pack
	price
	DECIMAL(10,2)
	NOT NULL, CHECK ≥ 0
	Selling price in USD
	original_price
	DECIMAL(10,2)
	NULLABLE
	Pre-discount price for UI badge
	file_url
	TEXT
	NULLABLE
	S3/CDN URL of the ZIP/PDF product file
	preview_url
	TEXT
	NULLABLE
	Sample file URL for marketplace preview
	thumbnail_url
	TEXT
	NULLABLE
	Cover image URL
	item_count
	INTEGER
	NOT NULL, DEFAULT 0
	Number of items in pack
	status
	ENUM
	NOT NULL, DEFAULT 'draft'
	draft | published | archived
	tags
	TEXT[]
	NULLABLE
	Searchable keyword tags
	view_count
	INTEGER
	NOT NULL, DEFAULT 0
	Marketplace impression count
	purchase_count
	INTEGER
	NOT NULL, DEFAULT 0
	Total sales count
	created_by
	UUID
	FK → users.id
	Admin who created the pack
	content_ids
	TEXT[]
	NULLABLE
	MongoDB ObjectIds of source content
	created_at
	TIMESTAMPTZ
	NOT NULL, DEFAULT NOW()
	

	updated_at
	TIMESTAMPTZ
	NOT NULL, DEFAULT NOW()
	

	deleted_at
	TIMESTAMPTZ
	NULLABLE
	Soft delete
	

Indexes: UNIQUE(slug), INDEX(product_type), INDEX(status), INDEX(price), GIN(tags), INDEX(created_at DESC).


5.1.3 Table: orders
Column
	Type
	Constraints
	Description
	id
	UUID
	PK
	

	user_id
	UUID
	FK → users.id, NOT NULL
	Purchasing customer
	order_number
	VARCHAR(20)
	NOT NULL, UNIQUE
	Human-readable e.g. ORD-2026-00142
	total_price
	DECIMAL(10,2)
	NOT NULL
	Sum of all order items
	currency
	CHAR(3)
	NOT NULL, DEFAULT 'USD'
	ISO 4217 currency code
	status
	ENUM
	NOT NULL, DEFAULT 'pending'
	pending | paid | cancelled | refunded
	stripe_payment_intent_id
	VARCHAR(255)
	NULLABLE, UNIQUE
	Stripe PI reference
	stripe_charge_id
	VARCHAR(255)
	NULLABLE
	Stripe charge reference
	paid_at
	TIMESTAMPTZ
	NULLABLE
	Payment confirmation timestamp
	notes
	TEXT
	NULLABLE
	Internal admin notes
	created_at
	TIMESTAMPTZ
	NOT NULL, DEFAULT NOW()
	

	updated_at
	TIMESTAMPTZ
	NOT NULL, DEFAULT NOW()
	

	

5.1.4 Table: order_items
Column
	Type
	Constraints
	Description
	id
	UUID
	PK
	

	order_id
	UUID
	FK → orders.id, NOT NULL
	Parent order
	product_id
	UUID
	FK → products.id, NOT NULL
	Product purchased
	unit_price
	DECIMAL(10,2)
	NOT NULL
	Price at time of purchase (snapshot)
	quantity
	INTEGER
	NOT NULL, DEFAULT 1
	Always 1 for digital goods
	product_snapshot
	JSONB
	NOT NULL
	Full product data snapshot at purchase
	

5.1.5 Table: downloads
Column
	Type
	Constraints
	Description
	id
	UUID
	PK
	

	user_id
	UUID
	FK → users.id, NOT NULL
	Downloader
	product_id
	UUID
	FK → products.id, NOT NULL
	Product file downloaded
	order_id
	UUID
	FK → orders.id, NOT NULL
	Validates purchase entitlement
	download_count
	INTEGER
	NOT NULL, DEFAULT 1
	Downloads per purchase (max 5)
	ip_address
	INET
	NULLABLE
	Client IP for fraud detection
	user_agent
	TEXT
	NULLABLE
	Browser/device info
	last_downloaded_at
	TIMESTAMPTZ
	NOT NULL, DEFAULT NOW()
	

	created_at
	TIMESTAMPTZ
	NOT NULL, DEFAULT NOW()
	

	

5.1.6 Table: approvals
Column
	Type
	Constraints
	Description
	id
	UUID
	PK
	

	content_id
	VARCHAR(100)
	NOT NULL
	MongoDB ObjectId of reviewed content
	content_type
	ENUM
	NOT NULL
	prompt | script | poster | social_post
	status
	ENUM
	NOT NULL, DEFAULT 'pending'
	pending | approved | rejected | edited_approved
	reviewer_notes
	TEXT
	NULLABLE
	Reason for rejection or edit notes
	reviewed_by
	UUID
	FK → users.id, NULLABLE
	Reviewer user (null = pending)
	reviewed_at
	TIMESTAMPTZ
	NULLABLE
	Timestamp of decision
	edited_content
	JSONB
	NULLABLE
	Overridden content if reviewer edited before approve
	batch_id
	VARCHAR(100)
	NULLABLE
	Groups items from the same generation run
	created_at
	TIMESTAMPTZ
	NOT NULL, DEFAULT NOW()
	

	

5.1.7 Table: api_keys
Column
	Type
	Constraints
	Description
	id
	UUID
	PK
	

	user_id
	UUID
	FK → users.id
	Owner (admin only)
	key_hash
	VARCHAR(255)
	NOT NULL, UNIQUE
	SHA-256 hash of raw key
	name
	VARCHAR(100)
	NOT NULL
	Label e.g. 'OpenAI Production'
	provider
	VARCHAR(50)
	NOT NULL
	openai | anthropic | stability_ai
	is_active
	BOOLEAN
	NOT NULL, DEFAULT TRUE
	

	last_used_at
	TIMESTAMPTZ
	NULLABLE
	

	created_at
	TIMESTAMPTZ
	NOT NULL, DEFAULT NOW()
	

	

________________


5.2 MongoDB — Document Database
MongoDB stores all AI-generated content. Its schema-flexible nature accommodates the varying structures of prompts, scripts, posters, and social posts. Each collection uses Mongoose schemas with validation. All ObjectId fields are indexed.


5.2.1 Collection: prompts
{
  _id:           ObjectId,
  prompt_text:   String,        // required, min 20 chars
  category:      String,        // enum: cinematic|youtube|art|video|marketing|nature|architecture|fashion|food|tech
  subcategory:   String,        // e.g. 'portrait', 'landscape', 'abstract'
  tags:          [String],      // auto-generated keywords
  style:         String,        // photorealistic|illustrated|minimalist|cinematic|watercolor
  aspect_ratio:  String,        // 1:1|16:9|9:16|4:3
  quality_score: Number,        // 0-100, assigned by scoring service
  generated_by:  String,        // 'gpt-4o'|'claude-3'|'gemini-pro'
  model_version: String,        // exact model version string
  status:        String,        // enum: pending|approved|rejected|archived
  batch_id:      String,        // groups items from same cron run
  token_count:   Number,        // token usage for cost tracking
  created_at:    Date,
  updated_at:    Date
}


5.2.2 Collection: scripts
{
  _id:           ObjectId,
  title:         String,        // required — video title
  topic:         String,        // required — core subject matter
  hook:          String,        // opening 15-second attention grab
  intro:         String,        // 30-second introduction
  body_sections: [{
    section_title: String,
    content:       String,
    duration_sec:  Number
  }],
  outro:         String,        // CTA and closing
  total_word_count: Number,
  estimated_duration_min: Number,
  category:      String,        // tutorial|review|vlog|explainer|shorts
  platform:      String,        // youtube|tiktok|instagram_reels
  tone:          String,        // educational|entertaining|inspirational|professional
  generated_by:  String,
  status:        String,        // pending|approved|rejected|archived
  batch_id:      String,
  created_at:    Date,
  updated_at:    Date
}


5.2.3 Collection: posters
{
  _id:           ObjectId,
  prompt:        String,        // full image generation prompt
  negative_prompt: String,      // elements to exclude
  image_url:     String,        // generated image CDN URL
  thumbnail_url: String,        // 300x300 preview
  theme:         String,        // motivational|minimalist|retro|neon|nature|corporate
  color_palette: [String],      // hex codes ['#FF5733','#C70039']
  dimensions:    { width: Number, height: Number },
  tags:          [String],
  generator:     String,        // dall-e-3|stable-diffusion|midjourney-api
  generation_params: {          // full parameter set for reproducibility
    model:   String,
    steps:   Number,
    cfg:     Number,
    seed:    Number
  },
  status:        String,        // pending|approved|rejected|archived
  batch_id:      String,
  created_at:    Date,
  updated_at:    Date
}


5.2.4 Collection: social_posts
{
  _id:           ObjectId,
  platform:      String,        // enum: instagram|youtube|tiktok|twitter|linkedin
  caption:       String,        // required — main post text
  hashtags:      [String],      // without # prefix
  emoji_set:     [String],      // relevant emojis
  cta:           String,        // call-to-action sentence
  category:      String,        // lifestyle|tech|business|fitness|food|travel
  content_pillar:String,        // educate|entertain|inspire|promote
  char_count:    Number,        // validated against platform limit
  word_count:    Number,
  best_post_times: [String],    // e.g. ['09:00','17:00']
  generated_by:  String,
  status:        String,
  batch_id:      String,
  created_at:    Date,
  updated_at:    Date
}


5.2.5 Collection: generation_logs
{
  _id:              ObjectId,
  batch_id:         String,     // UUID linking all items from this run
  generator_type:   String,     // prompts|scripts|posters|social_posts
  trigger:          String,     // cron|manual|api
  triggered_by:     String,     // user UUID or 'system'
  items_requested:  Number,
  items_generated:  Number,
  items_failed:     Number,
  execution_time_ms:Number,
  tokens_used:      Number,
  estimated_cost_usd: Number,
  model_used:       String,
  status:           String,     // running|completed|partial|failed
  error_details:    [String],   // error messages for failed items
  created_at:       Date,
  completed_at:     Date
}


________________


6. NestJS Module Architecture
6.1 Module Structure
src/
├── main.ts                       # Bootstrap, Swagger, global pipes
├── app.module.ts                 # Root module
├── config/
│   ├── database.config.ts        # PG + Mongo connection configs
│   ├── jwt.config.ts
│   └── storage.config.ts
├── common/
│   ├── decorators/               # @Roles(), @Public(), @CurrentUser()
│   ├── filters/                  # GlobalExceptionFilter
│   ├── guards/                   # JwtAuthGuard, RolesGuard
│   ├── interceptors/             # LoggingInterceptor, TransformInterceptor
│   ├── pipes/                    # ValidationPipe
│   └── dto/                      # Shared DTOs (PaginationDto, etc.)
├── modules/
│   ├── auth/                     # JWT auth, login, register, refresh
│   ├── users/                    # CRUD, role management
│   ├── ai-generator/             # LLM calls, generation orchestration
│   ├── categorisation/           # Auto-tag & categorise content
│   ├── prompts/                  # MongoDB CRUD for prompts
│   ├── scripts/                  # MongoDB CRUD for scripts
│   ├── posters/                  # MongoDB CRUD for posters
│   ├── social/                   # MongoDB CRUD for social_posts
│   ├── approvals/                # Review workflow
│   ├── products/                 # PG product management
│   ├── product-builder/          # Pack creation, PDF/ZIP generation
│   ├── orders/                   # Checkout, Stripe integration
│   ├── downloads/                # Secure file delivery
│   ├── dashboard/                # Statistics aggregation
│   ├── automation/               # Cron schedulers
│   └── storage/                  # S3/Cloudinary abstraction


6.2 Module Responsibilities
Module
	Key Services / Methods
	Dependencies
	auth
	AuthService: login(), register(), refreshToken(), logout()JwtStrategy, LocalStrategy, RolesGuard
	users, JWT, bcrypt
	ai-generator
	GeneratorService: generatePrompts(n), generateScripts(n), generatePosters(n), generateSocialPosts(n)LLMClientService: callOpenAI(), callAnthropic()
	prompts, scripts, posters, social, categorisation, storage
	categorisation
	CategorisationService: categorise(text), extractTags(text), scoreQuality(text)Rule-based + embedding similarity
	ai-generator
	approvals
	ApprovalsService: getPending(), approve(id), reject(id,reason), bulkApprove(ids)ApprovalsCrudService
	users, prompts, scripts, posters, social
	product-builder
	BuilderService: createPromptPack(ids), createPosterPack(ids), generatePDF(items), createZip(files)PdfService, ZipService
	products, storage, prompts, posters, scripts, social
	orders
	OrdersService: createOrder(dto), handleStripeWebhook(event), refundOrder(id)StripeService
	users, products, downloads
	downloads
	DownloadsService: generateSignedUrl(productId, userId), trackDownload()S3 pre-signed URL generation
	orders, products, storage
	dashboard
	StatsService: getTotals(), getRecentActivity(), getRevenueSummary()Aggregates PG + Mongo
	all modules
	automation
	GenerationScheduler: @Cron handlers for daily batch generationCleanupScheduler: archive old rejected content
	ai-generator, generation_logs
	

________________


7. API Specifications
All endpoints are prefixed with /api/v1. Authentication uses Bearer JWT tokens. All requests and responses use JSON. Paginated endpoints accept ?page=1&limit=20. Error responses follow RFC 7807 Problem Details format.


7.1 Authentication
Method
	Endpoint
	Auth
	Request Body
	Response
	POST
	/auth/register
	Public
	{ email, password, full_name }
	201 + { user, accessToken, refreshToken }
	POST
	/auth/login
	Public
	{ email, password }
	200 + { user, accessToken, refreshToken }
	POST
	/auth/refresh
	Public
	{ refreshToken }
	200 + { accessToken, refreshToken }
	POST
	/auth/logout
	JWT
	Bearer token
	200 + { message }
	POST
	/auth/verify-email
	Public
	{ token }
	200 + { message }
	POST
	/auth/forgot-password
	Public
	{ email }
	200 + { message }
	POST
	/auth/reset-password
	Public
	{ token, newPassword }
	200 + { message }
	

7.2 Users
Method
	Endpoint
	Auth
	Description
	GET
	/users
	Admin
	List all users (paginated, filterable by role/status)
	GET
	/users/:id
	Admin
	Get single user detail
	PATCH
	/users/:id
	Admin
	Update user info or role
	DELETE
	/users/:id
	Super Admin
	Soft-delete user account
	GET
	/users/me
	JWT
	Get current user profile
	PATCH
	/users/me
	JWT
	Update own profile / avatar
	PATCH
	/users/me/password
	JWT
	Change own password
	

7.3 AI Generation
Method
	Endpoint
	Auth
	Request Body
	Description
	POST
	/ai/generate/prompts
	Admin
	{ count: number, category?: string }
	Trigger prompt generation batch
	POST
	/ai/generate/scripts
	Admin
	{ count: number, topic?: string, platform?: string }
	Trigger script generation
	POST
	/ai/generate/posters
	Admin
	{ count: number, theme?: string }
	Trigger poster generation
	POST
	/ai/generate/social
	Admin
	{ count: number, platform?: string, category?: string }
	Trigger social post generation
	GET
	/ai/generate/logs
	Admin
	—
	List generation logs (paginated)
	GET
	/ai/generate/logs/:batchId
	Admin
	—
	Detail of a specific batch run
	GET
	/ai/generate/cost-estimate
	Admin
	—
	Estimated token cost for next batch
	

7.4 Content — Prompts / Scripts / Posters / Social
Method
	Endpoint
	Auth
	Description
	GET
	/prompts
	Reviewer+
	List prompts (filter: status, category, batch_id)
	GET
	/prompts/:id
	Reviewer+
	Get single prompt
	PATCH
	/prompts/:id
	Reviewer+
	Edit prompt text or metadata
	DELETE
	/prompts/:id
	Admin
	Soft-delete prompt
	GET
	/scripts
	Reviewer+
	List scripts (same filter pattern)
	GET
	/scripts/:id
	Reviewer+
	Get single script
	PATCH
	/scripts/:id
	Reviewer+
	Edit script content
	GET
	/posters
	Reviewer+
	List posters
	GET
	/posters/:id
	Reviewer+
	Get poster detail + image URL
	GET
	/social
	Reviewer+
	List social posts
	PATCH
	/social/:id
	Reviewer+
	Edit caption or hashtags
	

7.5 Review / Approvals
Method
	Endpoint
	Auth
	Request Body
	Description
	GET
	/approvals
	Reviewer+
	—
	Get all approval records (filter by status/type)
	GET
	/approvals/pending
	Reviewer+
	—
	Pending review queue (paginated)
	POST
	/approvals/:id/approve
	Reviewer+
	{ editedContent?: object }
	Approve item (optionally with edits)
	POST
	/approvals/:id/reject
	Reviewer+
	{ reason: string }
	Reject with required reason
	POST
	/approvals/bulk-approve
	Admin
	{ ids: string[] }
	Bulk approve list of IDs
	POST
	/approvals/bulk-reject
	Admin
	{ ids: string[], reason: string }
	Bulk reject
	GET
	/approvals/stats
	Admin
	—
	Approval rate, avg review time, reviewer leaderboard
	

7.6 Products
Method
	Endpoint
	Auth
	Description
	GET
	/products
	Public
	List published products (marketplace) — filter by type, price, tags
	GET
	/products/:id
	Public
	Product detail page data
	GET
	/products/:id/preview
	Public
	Download sample preview file
	POST
	/products
	Admin
	Create product record manually
	POST
	/products/create-pack
	Admin
	Build product pack from approved content IDs
	PATCH
	/products/:id
	Admin
	Update product metadata or price
	PATCH
	/products/:id/publish
	Admin
	Publish draft product
	PATCH
	/products/:id/archive
	Admin
	Archive product (removes from marketplace)
	DELETE
	/products/:id
	Super Admin
	Soft-delete product
	GET
	/products/admin/list
	Admin
	List ALL products (includes draft/archived)
	

7.7 Orders & Checkout
Method
	Endpoint
	Auth
	Description
	POST
	/orders/checkout
	JWT
	Create Stripe Payment Intent, return client secret
	POST
	/orders/webhook
	Public (Stripe sig)
	Handle Stripe webhook events (payment_intent.succeeded, etc.)
	GET
	/orders
	JWT
	Get current user's order history
	GET
	/orders/:id
	JWT
	Single order detail
	GET
	/orders/admin/list
	Admin
	All orders (filter by status, date range, user)
	POST
	/orders/:id/refund
	Admin
	Issue Stripe refund
	GET
	/orders/:id/invoice
	JWT
	Download PDF invoice
	

7.8 Downloads
Method
	Endpoint
	Auth
	Description
	GET
	/downloads/:productId/link
	JWT
	Generate time-limited signed URL (15 min expiry)
	GET
	/downloads/history
	JWT
	User's download history
	GET
	/downloads/admin/list
	Admin
	All download events (with IP, device info)
	

7.9 Dashboard & Analytics
Method
	Endpoint
	Auth
	Description
	GET
	/dashboard/overview
	Admin
	Total prompts, posters, pending, products, revenue
	GET
	/dashboard/content-stats
	Admin
	Content generated per day chart data (30 days)
	GET
	/dashboard/revenue
	Admin
	Revenue by day/week/month, top products
	GET
	/dashboard/automation-status
	Admin
	Next scheduled run, last run summary
	GET
	/dashboard/reviewer-stats
	Admin
	Per-reviewer approval counts and avg time
	

________________


8. Frontend Screen Specifications
The frontend is a single-page application (SPA) served from a CDN. Admin and reviewer routes are protected by JWT stored in an httpOnly cookie. The public marketplace is fully server-side renderable for SEO. All screens are responsive (mobile-first, breakpoints at 768px and 1280px).


8.1 Screen 1 — Admin Dashboard (Overview)
Route: /admin/dashboard  |  Access: Admin, Super Admin


Purpose
The central command centre. Provides a real-time snapshot of the entire factory's health — content pipeline status, pending work items, revenue, and automation schedule.
Layout
Zone
	Content
	Top Navigation Bar
	Logo | Dashboard | Generator | Review Queue | Product Builder | Marketplace | Orders | Settings | User Avatar + Logout
	Page Header
	'Dashboard' title | Date/Time | 'Trigger Generation Now' CTA button (orange accent)
	KPI Cards Row
	Six metric cards (see below) — responsive grid, 3-per-row on desktop, 2 tablet, 1 mobile
	Charts Row (left 60%)
	'Content Generated — Last 30 Days' area chart; series: prompts, scripts, posters, social posts
	Activity Feed (right 40%)
	Live feed of recent events: approvals, rejections, product publishes, new orders
	Automation Status Panel
	Next scheduled run countdown timer | Last batch result | Toggle automation ON/OFF
	Top Products Table
	5 best-selling products: thumbnail, name, type, price, sales count, revenue
	Reviewer Leaderboard
	Reviewer name, items reviewed today/week, avg review time
	

KPI Cards
Card
	Value
	Trend Indicator
	Colour
	Total Content Generated
	Count (all time)
	vs. yesterday
	Indigo
	Pending Review
	Count
	vs. yesterday
	Orange
	Approved Today
	Count
	vs. yesterday avg
	Green
	Products Published
	Count (all time)
	vs. last week
	Blue
	Total Revenue
	USD
	vs. last 30 days
	Green
	Orders Today
	Count
	vs. yesterday
	Teal
	

Interactions
* Clicking any KPI card navigates to the relevant detailed view.
* 'Trigger Generation Now' opens a modal to select content type and quantity, then calls POST /ai/generate/{type}.
* 'Toggle Automation' calls PATCH /automation/toggle and updates scheduler state in real-time.
* Charts support hover tooltips and a date range selector (7d, 30d, 90d, custom).
* Activity feed auto-refreshes every 30 seconds via polling (or WebSocket if enabled).


8.2 Screen 2 — AI Generator Panel
Route: /admin/generator  |  Access: Admin, Super Admin
Purpose
Allows admins to trigger manual content generation runs on demand, configure generation parameters, and monitor active generation jobs in real time.
Layout
Zone
	Content
	Page Header
	'AI Generator' | Subtitle: 'Trigger and monitor content generation runs'
	Generation Cards Grid
	One card per content type: Prompts, Scripts, Posters, Social Posts
	Active Jobs Panel
	Table of currently running or recent jobs with live progress bars
	Cost Estimator Widget
	Shows estimated token cost for the selected batch size
	Generation History Table
	Past generation runs: batch ID, type, count, status, cost, timestamp
	

Each Generation Card Contains
* Content type icon and label (e.g. '✦ AI Prompts').
* Description of what will be generated.
* Quantity input field (default: prompts=50, scripts=10, posters=20, social=30).
* Advanced options: category selector, model selector (GPT-4o / Claude-3), tone/style.
* 'Generate Now' primary button — triggers POST /ai/generate/{type}.
* 'Last Run' pill showing status of most recent generation for this type.
Active Jobs Panel
* Real-time progress bar showing items generated vs. total requested.
* Elapsed time counter.
* Cancel button (calls DELETE /ai/generate/jobs/:batchId).
* On completion, shows summary: generated, failed, tokens used, cost.


8.3 Screen 3 — Review Queue
Route: /admin/review  |  Access: Reviewer, Admin, Super Admin
Purpose
The quality-control station. Reviewers work through pending AI-generated items one at a time or in batches. This is the most interaction-intensive screen in the application.
Layout
Zone
	Content
	Filter Bar
	Content type tabs: All | Prompts | Scripts | Posters | Social | Category dropdown | Batch ID filter | Status filter
	Queue Stats
	Pending count | Approved today | Rejected today | Avg review time
	Item List (left 35%)
	Scrollable list of pending items with type icon, truncated text, category badge, timestamp, assignee
	Preview Panel (right 65%)
	Full content preview of selected item, with all fields visible and editable
	Action Bar (bottom of panel)
	Edit | Approve | Reject | Skip | Previous / Next navigation
	Bulk Actions Bar (top)
	Select All | Bulk Approve | Bulk Reject | Export Selected
	

Preview Panel — Per Content Type
Type
	Fields Shown in Preview
	Prompt
	Full prompt text (editable textarea) | Category | Tags (editable chips) | Quality score badge | AI model used | Character count
	Script
	Title | Topic | Hook | Body sections (collapsible) | Outro | Duration | Platform | Word count | Tone
	Poster
	Large image preview (generated) | Prompt text (editable) | Theme | Color palette swatches | Tags | Generator params
	Social Post
	Caption (editable) | Platform icon | Hashtags (editable chips) | Emoji set | CTA | Character counter with platform limit indicator
	

Actions
* Approve: calls POST /approvals/:id/approve with optional edited content, moves item to 'approved'.
* Approve with Edits: inline edit fields become enabled; reviewer saves changes then approves.
* Reject: opens reason modal (required, min 10 chars), calls POST /approvals/:id/reject.
* Skip: moves to next item without acting (item stays pending, logged in session).
* Keyboard shortcuts: A=approve, R=reject, E=edit, →=next, ←=previous.
* Bulk approve: checkbox multi-select then 'Bulk Approve' button with confirmation modal.


8.4 Screen 4 — Product Builder
Route: /admin/product-builder  |  Access: Admin, Super Admin
Purpose
Transforms approved content items into sellable product packs. The admin selects approved items, configures the product, and the system generates a downloadable file (PDF or ZIP) and creates a product record in PostgreSQL.
Layout
Zone
	Content
	Page Header
	'Product Builder' | Subtitle: 'Create product packs from approved content'
	Step Indicator
	Step 1: Select Content → Step 2: Configure Product → Step 3: Generate & Preview → Step 4: Publish
	Step 1: Content Selector
	Product type selector | Approved-content table with checkboxes | Filter by category/batch | Selected count badge | Min/Max item guidelines
	Step 2: Product Config
	Title field | Description (rich text) | Price input | Short description | Thumbnail upload | Tags input | SEO slug (auto-generated, editable)
	Step 3: Generate
	'Generate Pack' button | Progress indicator | Preview PDF/ZIP | Download sample
	Step 4: Publish
	Product summary card | 'Save as Draft' | 'Publish to Marketplace' buttons
	

Business Rules
* Prompt packs require 20–100 approved prompts.
* Poster packs require 5–20 approved posters.
* Script bundles require 3–15 approved scripts.
* Social packs require 15–60 approved social posts.
* Each approved item can only be included in one published product (prevents duplicate content).
* Price must be between $0.99 and $499.99.
* PDF generation uses PDFKit; content is formatted with cover page, index, and watermark.
* ZIP file contains PDFs, any image assets, a README.txt with licensing terms.


8.5 Screen 5 — Marketplace
Route: /marketplace (public) and /marketplace/:slug (product detail)  |  Access: Public
Purpose
The customer-facing storefront. Displays all published products, supports filtering and search, and drives conversion to purchase.
Marketplace Listing Page Layout
Zone
	Content
	Navbar (sticky)
	Logo | Search bar | Product type nav tabs | Cart icon with count | Login / Register or User avatar
	Hero Banner
	Headline, subtitle, and featured product carousel (3 featured products)
	Filter Sidebar (left 20%)
	Product type checkboxes | Price range slider | Sort (Newest, Bestselling, Price ↑, Price ↓) | Tag cloud
	Product Grid (right 80%)
	Responsive card grid: 4-col desktop, 2-col tablet, 1-col mobile
	Product Card
	Thumbnail | Type badge | Title | Short description | Item count | Price | 'View Details' + 'Buy Now' buttons | Sales count badge
	Pagination
	Numbered pagination OR infinite scroll toggle
	Footer
	About | FAQ | Refund Policy | Licensing Terms | Contact
	

Product Detail Page Layout
Zone
	Content
	Breadcrumb
	Marketplace → Category → Product Name
	Product Hero (left 50%)
	Large thumbnail | Preview gallery (up to 5 images) | 'Preview Sample' button (downloads free preview file)
	Product Info (right 50%)
	Title | Type badge | Price (with original price if discounted) | Item count pill | Description | Tag chips | 'Buy Now' CTA button | 'Add to Wishlist'
	What's Included
	Accordion listing item categories and example content from the pack
	Licensing Info
	Clear display of license type (personal, commercial, extended)
	Reviews Section
	Star rating average | Individual reviews | 'Leave a Review' (post-purchase only)
	Related Products
	Horizontal scroll of 4 similar product cards
	

Checkout Flow
1. User clicks 'Buy Now' → redirected to /checkout if not logged in, else proceeds.
2. Checkout page shows order summary (product thumbnail, title, price, tax).
3. Stripe Elements embedded card form — PCI compliant, no card data touches our server.
4. Submit calls POST /orders/checkout to create Payment Intent, receives client_secret.
5. Frontend confirms payment via stripe.confirmCardPayment(clientSecret).
6. On success, Stripe fires webhook → our server marks order paid, triggers download email.
7. User redirected to /orders/:id/success with download link.


8.6 Screen 6 — Orders Management
Route: /admin/orders (admin) and /account/orders (customer)  |  Dual-role screen
Admin Orders View
Zone
	Content
	Filter Bar
	Status tabs: All | Pending | Paid | Cancelled | Refunded | Date range picker | Search by order number / customer email
	Orders Table
	Order number | Customer name+email | Products (comma-separated) | Total | Status badge | Payment method | Date | Actions
	Row Actions
	View Detail | Issue Refund | Download Invoice | Copy Order ID
	Summary Cards
	Today's Revenue | Orders Today | Refunds This Month | Average Order Value
	Export Button
	CSV export of filtered orders
	

Customer Orders View
Route: /account/orders  |  Access: Authenticated Customer
Zone
	Content
	Order History Table
	Order number | Products | Total | Date | Status | Download button
	Order Detail Page
	/account/orders/:id — full receipt, itemised products, download links for each product
	Download Button
	Calls GET /downloads/:productId/link — generates a 15-minute signed S3 URL
	Re-download Limit
	Max 5 downloads per purchase displayed with counter
	

Order Detail Page Fields
* Order number, date, and status badge.
* Billing email and payment method last four digits.
* Itemised product list with unit prices, thumbnail, and download button.
* Subtotal, tax, discount (if any), and total.
* 'Download Invoice (PDF)' button.


8.7 Screen 7 — Settings
Route: /admin/settings  |  Access: Super Admin
Section
	Settings Available
	API Keys
	Add/remove LLM provider keys (OpenAI, Anthropic, Stability AI), test connectivity, view usage
	Generation Config
	Default batch sizes per content type, cron schedule editor, quality score threshold for auto-approval
	Storage
	S3 bucket config, Cloudinary credentials, CDN prefix URL
	Payments
	Stripe public/secret key, webhook signing secret, currency, tax rate
	Email
	SMTP config, email template previews, sender name/address
	Security
	JWT expiry times, max download count, rate limit thresholds, allowed IPs for admin
	Users
	Invite new admin/reviewer, deactivate accounts, reset passwords
	

________________


9. Automation Workflow
9.1 Cron Schedule
Job Name
	Schedule (UTC)
	Action
	Volume
	Generate Prompts
	Daily 02:00
	Calls generatePrompts(50)
	50 prompts / run
	Generate Scripts
	Daily 03:00
	Calls generateScripts(10)
	10 scripts / run
	Generate Posters
	Daily 04:00
	Calls generatePosters(20)
	20 posters / run
	Generate Social Posts
	Daily 05:00
	Calls generateSocialPosts(30)
	30 posts / run
	Archive Rejected
	Weekly Sunday 01:00
	Archives rejected content older than 30 days
	Variable
	Clean Temp Files
	Daily 00:30
	Deletes unlinked temp files from storage
	Variable
	Stats Rollup
	Daily 23:55
	Aggregates daily stats into dashboard cache
	All records
	Refresh Signed URLs
	Hourly
	Re-generates expiring product file links
	Active products
	

9.2 Generation Workflow — Detailed Steps
8. Scheduler fires → GenerationScheduler.handlePromptGeneration() called.
9. New batch_id (UUID) generated and GenerationLog document created in MongoDB with status='running'.
10. LLMClientService.callOpenAI() sends system prompt + user prompt to configured model.
11. Response parsed → individual items extracted and validated (min length, no banned words).
12. CategorisationService.categorise(text) assigns category and subcategory using keyword matching + embedding similarity.
13. CategorisationService.extractTags(text) generates 3–7 keyword tags.
14. CategorisationService.scoreQuality(text) returns 0–100 quality score.
15. Items with score ≥ configured threshold (default 75) are saved to MongoDB with status='pending'.
16. Items below threshold are saved with status='rejected' and logged.
17. For each saved item, an Approval record is created in PostgreSQL with status='pending'.
18. Generation log updated with final counts and status='completed'.
19. Admin notified via email/dashboard that new content is ready for review.


9.3 Product Creation Workflow
20. Admin opens Product Builder and selects approved content items.
21. System validates: correct count, no previously used items, all status='approved'.
22. Admin configures: title, description, price, thumbnail.
23. ProductBuilderService.generatePDF(items) creates formatted PDF using PDFKit.
24. ProductBuilderService.createZip(files) bundles PDF + any images + README.
25. ZIP file uploaded to S3 via StorageService.upload(). Returns permanent URL.
26. Product record created in PostgreSQL (status='draft', file_url=S3_URL).
27. Admin previews product and clicks 'Publish'.
28. Product status set to 'published' — now visible in marketplace.
29. Source content items updated: in_product=true (prevents reuse).


________________


10. Security Model
10.1 Authentication & Authorisation
Concern
	Implementation
	Password Hashing
	bcrypt, cost factor 12
	Access Token
	JWT, HS256, 15-minute expiry, signed with 512-bit secret
	Refresh Token
	JWT, HS256, 7-day expiry, stored as hash in DB; invalidated on logout
	Role Enforcement
	NestJS RolesGuard on every protected route
	API Key Storage
	SHA-256 hashed; raw key shown once at creation, never stored
	httpOnly Cookies
	Refresh tokens set as httpOnly SameSite=Strict cookies
	CORS
	Whitelist of allowed origins configured per environment
	

10.2 Input Validation & Sanitisation
* All request bodies validated via class-validator DTOs with explicit whitelist:true and forbidNonWhitelisted:true.
* All text inputs sanitised with DOMPurify equivalent on server (strip HTML tags).
* File uploads: type whitelist (image/jpeg, image/png, application/pdf), max size 10 MB.
* MongoDB queries use parameterised inputs via Mongoose — no raw query string interpolation.
* PostgreSQL uses TypeORM parameterised queries — no raw SQL string concatenation.


10.3 Rate Limiting
Endpoint Group
	Limit
	Window
	POST /auth/login
	5 attempts
	15 minutes (IP-based)
	POST /auth/register
	3 registrations
	1 hour (IP-based)
	POST /ai/generate/*
	10 requests
	1 hour (user-based)
	GET /products (public)
	300 requests
	1 minute (IP-based)
	POST /orders/checkout
	10 requests
	1 hour (user-based)
	GET /downloads/*/link
	20 requests
	1 hour (user-based)
	All other authenticated
	200 requests
	1 minute (user-based)
	

10.4 Stripe Security
* Stripe webhook signature verified using stripe.webhooks.constructEvent() with signing secret.
* Card data never touches our servers — Stripe.js / Elements handles all card input.
* Idempotency keys used for all payment creation calls.
* Stripe Payment Intent confirmed client-side; server only reads webhook outcomes.


10.5 File Delivery Security
* Product files stored in a private S3 bucket — no public access.
* Downloads served via 15-minute pre-signed S3 URLs generated only for verified purchasers.
* Download count tracked per user per product; enforced maximum of 5 downloads per purchase.
* Download endpoint logs IP address and user-agent for fraud detection.


________________


11. Storage & File Management
11.1 Storage Architecture
Asset Type
	Storage Location
	Access Pattern
	Naming Convention
	Product ZIP files
	S3 — private bucket
	Pre-signed URL, 15 min TTL
	products/{productId}/pack.zip
	Product PDF files
	S3 — private bucket
	Pre-signed URL, 15 min TTL
	products/{productId}/pack.pdf
	Preview sample files
	S3 — public bucket
	Direct CDN URL
	products/{productId}/preview.pdf
	Product thumbnails
	Cloudinary / S3 public
	Direct CDN URL
	products/{productId}/thumb.jpg
	Poster images
	Cloudinary / S3 public
	Direct CDN URL
	posters/{posterId}/image.jpg
	User avatars
	Cloudinary
	Direct CDN URL
	users/{userId}/avatar.jpg
	Invoice PDFs
	S3 — private bucket
	Pre-signed URL, 1 hour TTL
	orders/{orderId}/invoice.pdf
	

11.2 File Processing Pipeline
* On poster generation: raw image from AI API → resize to standard dimensions → compress (WebP) → upload to Cloudinary → store CDN URL in MongoDB.
* On product pack creation: PDFKit generates PDF in memory → Archiver bundles into ZIP → stream upload to S3 → store S3 key in PostgreSQL products table.
* On invoice generation: PDFKit generates receipt PDF → stream upload to S3 private bucket → pre-signed URL returned on demand.
* Images are processed through Sharp for resizing/optimisation before upload.


________________


12. Error Handling & Logging
12.1 Error Response Format
All API errors follow RFC 7807 Problem Details format. HTTP status codes follow REST conventions.
{
  "status":    400,
  "error":     "Bad Request",
  "message":   "Validation failed: price must be a positive number",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "path":      "/api/v1/products",
  "requestId": "req_abc123"
}


12.2 Error Code Reference
HTTP Status
	Use Case
	200 OK
	Successful GET, PATCH
	201 Created
	Successful POST (resource created)
	204 No Content
	Successful DELETE
	400 Bad Request
	DTO validation failures
	401 Unauthorized
	Missing or invalid JWT
	403 Forbidden
	Valid JWT but insufficient role
	404 Not Found
	Resource does not exist
	409 Conflict
	Duplicate email, duplicate slug
	422 Unprocessable Entity
	Business rule violation (e.g. product already published)
	429 Too Many Requests
	Rate limit exceeded (includes Retry-After header)
	500 Internal Server Error
	Unhandled exceptions (never expose stack trace in production)
	502 Bad Gateway
	LLM API unreachable
	503 Service Unavailable
	Database connection failure
	

12.3 Logging Strategy
* Structured JSON logging via Winston with levels: error, warn, info, debug.
* Every request logged with: requestId, userId, method, path, statusCode, responseTimeMs.
* LLM API calls logged with: model, tokenCount, costUSD, latencyMs, batchId.
* All approval actions logged with: reviewerId, contentId, action, timestamp, reason.
* Critical errors (500, LLM failures, Stripe errors) trigger alerting via PagerDuty / Slack webhook.
* Logs shipped to CloudWatch / Datadog for searchability and retention (90 days).


________________


13. Deployment Architecture
13.1 Environment Overview
Environment
	Purpose
	Deployment Target
	Development
	Local development with Docker Compose
	Localhost
	Staging
	Pre-production testing, QA sign-off
	Cloud (same infra as prod, smaller scale)
	Production
	Live system
	Cloud — auto-scaling
	

13.2 Infrastructure Components
Component
	Technology
	Notes
	API Servers
	Node.js containers on ECS / Kubernetes
	Horizontally scalable, min 2 instances
	PostgreSQL
	AWS RDS PostgreSQL (Multi-AZ)
	Automated backups, read replica for analytics
	MongoDB
	MongoDB Atlas (M30 cluster)
	Auto-scaling, 3-node replica set
	Object Storage
	AWS S3
	Private + public buckets, lifecycle policies
	CDN
	AWS CloudFront / Cloudinary
	Static assets, product thumbnails
	Cache
	Redis (ElastiCache)
	Session store, rate limiting counters, dashboard stats cache
	Load Balancer
	AWS ALB
	SSL termination, health checks
	Secrets Manager
	AWS Secrets Manager
	API keys, DB credentials, JWT secrets
	CI/CD
	GitHub Actions
	Test → Build → Push ECR → Deploy ECS
	Monitoring
	CloudWatch + Datadog + PagerDuty
	Metrics, alerts, on-call rotation
	

13.3 CI/CD Pipeline
30. Developer opens Pull Request → GitHub Actions triggers test suite (unit + e2e).
31. All tests pass + coverage ≥ 85% → merge to main allowed.
32. Merge to main → Docker image built, tagged with commit SHA, pushed to ECR.
33. Staging deployment auto-triggered → ECS service updated with new image.
34. QA sign-off on staging → manual approval in GitHub Actions to promote to production.
35. Production ECS rolling update with zero-downtime deployment (min 50% healthy).
36. Post-deploy smoke tests run → Slack notification of deployment success.


________________


14. Non-Functional Requirements
Category
	Requirement
	Target
	Performance
	API response time (p95)
	< 300 ms
	Performance
	API response time (p99)
	< 800 ms
	Performance
	Page load (LCP)
	< 2.5 s
	Performance
	PDF generation time
	< 10 s for 50-item pack
	Scalability
	Concurrent users (marketplace)
	5,000 simultaneous
	Scalability
	API throughput
	1,000 req/s at peak
	Availability
	System uptime (production)
	99.9% monthly (≤ 43.8 min downtime)
	Reliability
	Data backup frequency
	Every 6 hours (PG), continuous (Mongo Atlas)
	Reliability
	Recovery Time Objective (RTO)
	< 1 hour
	Reliability
	Recovery Point Objective (RPO)
	< 6 hours
	Security
	OWASP Top 10
	All mitigated
	Security
	PCI DSS
	Compliant via Stripe Elements (no card data stored)
	Security
	Data encryption at rest
	AES-256 (RDS, S3)
	Security
	Data encryption in transit
	TLS 1.3 minimum
	Maintainability
	Code test coverage
	≥ 85%
	Maintainability
	API documentation
	100% of endpoints in Swagger
	Compliance
	GDPR
	User data export + deletion on request
	Compliance
	Cookie consent
	Consent banner on public pages
	

________________


15. Implementation Roadmap
Phase
	Duration
	Scope
	Deliverable
	Phase 1 — Foundation
	Weeks 1–2
	Project scaffolding, Docker Compose, DB schemas, migrations, auth module (register/login/JWT), user CRUD
	Working auth API + local DB
	Phase 2 — AI Engine
	Weeks 3–4
	AI Generator module, LLM client service, categorisation service, MongoDB collections, generation logs
	Prompts & scripts generation working
	Phase 3 — Posters & Social
	Week 5
	Poster generation (image API integration), social post generation, quality scoring
	All 4 content types generating
	Phase 4 — Review System
	Weeks 6–7
	Approvals module, review queue API, bulk actions, reviewer assignment
	Full review workflow operational
	Phase 5 — Product Builder
	Weeks 8–9
	PDF generation, ZIP packaging, S3 upload, product CRUD, publish workflow
	End-to-end product creation
	Phase 6 — Marketplace & Checkout
	Weeks 10–12
	Public product listing, product detail pages, Stripe checkout, webhook handler, download delivery
	Revenue-generating marketplace live
	Phase 7 — Admin Dashboard
	Weeks 13–14
	Dashboard frontend, generator panel, review queue UI, product builder UI, analytics charts
	Complete admin interface
	Phase 8 — Automation
	Week 15
	Cron schedulers, notification emails, auto-archival, monitoring integration
	Lights-out automation operational
	Phase 9 — QA & Hardening
	Weeks 16–17
	Security audit, load testing, e2e test suite, performance optimisation, staging sign-off
	Staging approved for production
	Phase 10 — Production Launch
	Week 18
	Production deployment, DNS cutover, smoke tests, monitoring dashboards live
	🚀 Go-Live
	

________________


16. Acceptance Criteria & Definition of Done
16.1 Feature-Level Acceptance Criteria
Feature
	Acceptance Criteria
	User Registration
	User can register with email+password; email verification link sent; duplicate email returns 409; password min 8 chars enforced.
	AI Generation
	POST /ai/generate/prompts with count=50 returns 200 within 30s; 50 MongoDB documents created; generation log created; admin dashboard count increments.
	Review Queue
	Reviewer can view pending items; approve action sets status to 'approved' in both MongoDB and PG approvals table; reject requires non-empty reason.
	Product Builder
	Admin selects 50 approved prompts, configures product, clicks 'Generate' — PDF created, ZIP uploaded to S3, product record created in PG with file_url set.
	Marketplace
	Published products visible on /marketplace without authentication; filter by type works; product count matches DB; unpublished products not visible.
	Checkout
	Customer adds product to cart, completes Stripe test payment, receives order confirmation email, order status changes to 'paid', download link appears.
	Download Delivery
	Authenticated purchaser requests download link; 15-min signed S3 URL returned; 6th download attempt returns 403; non-purchaser returns 403.
	Automation
	Cron job fires at scheduled time; generation log created; new content visible in review queue; admin dashboard reflects new pending count.
	Security
	All admin routes return 401 without JWT; reviewer cannot access admin-only endpoints (403); SQL injection attempts handled safely; rate limits enforced.
	

16.2 Definition of Done
A feature is considered 'done' when ALL of the following are true:
* All acceptance criteria pass in a clean environment.
* Unit tests written and passing (≥ 85% branch coverage for the module).
* E2E tests covering the primary happy path and at least one error path.
* API endpoint documented in Swagger with request/response examples.
* No critical or high severity issues in SAST scan (GitHub CodeQL).
* Code reviewed and approved by at least one other engineer.
* Feature tested on staging environment by QA.
* Feature-flag removed if one was used during development.


________________


17. Appendix
17.1 Environment Variables
Variable
	Description
	Required
	NODE_ENV
	development | staging | production
	Yes
	PORT
	API server port (default 3000)
	Yes
	DATABASE_URL
	PostgreSQL connection string
	Yes
	MONGODB_URI
	MongoDB Atlas connection string
	Yes
	JWT_ACCESS_SECRET
	512-bit random string for access tokens
	Yes
	JWT_REFRESH_SECRET
	512-bit random string for refresh tokens
	Yes
	JWT_ACCESS_EXPIRES
	Access token TTL e.g. '15m'
	Yes
	JWT_REFRESH_EXPIRES
	Refresh token TTL e.g. '7d'
	Yes
	OPENAI_API_KEY
	OpenAI API key
	Yes
	ANTHROPIC_API_KEY
	Anthropic Claude API key
	Optional
	STABILITY_API_KEY
	Stability AI API key for posters
	Optional
	STRIPE_SECRET_KEY
	Stripe secret key
	Yes
	STRIPE_WEBHOOK_SECRET
	Stripe webhook signing secret
	Yes
	AWS_ACCESS_KEY_ID
	AWS credentials
	Yes
	AWS_SECRET_ACCESS_KEY
	AWS credentials
	Yes
	AWS_S3_BUCKET_PRIVATE
	S3 bucket for product files
	Yes
	AWS_S3_BUCKET_PUBLIC
	S3 bucket for thumbnails/previews
	Yes
	AWS_REGION
	AWS region e.g. us-east-1
	Yes
	CLOUDINARY_URL
	Cloudinary connection URL
	Optional
	SMTP_HOST
	Email server host
	Yes
	SMTP_USER
	Email server credentials
	Yes
	SMTP_PASS
	Email server credentials
	Yes
	FRONTEND_URL
	Base URL of frontend for email links
	Yes
	REDIS_URL
	Redis connection string
	Yes
	

17.2 Glossary
Term
	Definition
	Batch
	A group of content items generated in a single automation run, sharing a batch_id.
	Content Item
	A single AI-generated asset: one prompt, one script, one poster, or one social post.
	Product Pack
	A curated collection of content items bundled into a ZIP/PDF for sale.
	Quality Score
	A 0–100 score assigned by the categorisation service based on coherence, length, and originality heuristics.
	Pre-signed URL
	A temporary, time-limited URL granting access to a private S3 file without requiring AWS credentials.
	cron
	Unix-style time expressions used to schedule recurring background jobs.
	DTOs
	Data Transfer Objects — TypeScript classes decorated with class-validator rules to validate API request bodies.
	Soft Delete
	Marking a record as deleted via a deleted_at timestamp rather than physically removing the row.
	

© 2026 AI Content Factory  —  v1.0.0  —  CONFIDENTIAL