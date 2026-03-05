AI Content Factory — PRD Supplement v2.0.0  |  CONFIDENTIAL


PRODUCT REQUIREMENTS DOCUMENT — SUPPLEMENT
AI Content Factory
Phase 2: Advanced Automation, Missing Screens & Extended Feature Set
Companion to PRD v1.0.0 — Additive — No Duplicate Coverage




Document Version
	v2.0.0 — Supplement
	Companion Document
	AI Content Factory PRD v1.0.0
	Status
	Ready for Engineering — Phase 2
	Classification
	Internal — Confidential
	Coverage
	13 New Screens · 12 Advanced Automation Systems · 20+ New Features
	Stack Addition
	Elasticsearch · Redis Pub/Sub · Bull Queue · Stripe Tax · Nodemailer
	

AI Content Factory — All Rights Reserved
________________


Table of Contents




________________


1. Scope & Purpose of This Document
This document is the official supplement to the AI Content Factory PRD v1.0.0. It does not repeat any feature, screen, endpoint, or database table already specified in that document. Instead, it defines every capability gap identified after the initial PRD review — organised into three major categories: advanced automation intelligence systems that go beyond basic cron scheduling, entirely new frontend screens, and a full extended feature set covering commerce, discovery, community, integration, and operations.
Engineers implementing Phase 2 should treat both documents as a unified specification. Where a feature in this supplement extends a module defined in PRD v1 (for example, adding coupon logic to the existing orders module), that extension is called out explicitly with the module name.


1.1 What Was Already Specified (PRD v1 — Excluded Here)
Already Covered in PRD v1
	

	Core auth (login, register, JWT, refresh)
	Basic cron scheduling (4 daily jobs)
	User CRUD & role management
	S3 / Cloudinary storage abstraction
	4 content types: prompts, scripts, posters, social
	Stripe checkout (basic Payment Intent flow)
	Categorisation & quality scoring
	Download delivery (signed URLs, 5-download limit)
	Review / approval workflow
	6 admin screens (dashboard, generator, review, builder, marketplace, orders)
	Product builder (PDF + ZIP)
	Security model, rate limiting, deployment
	Basic marketplace & product detail
	PostgreSQL + MongoDB schemas (core tables)
	

1.2 New Feature Inventory
Category
	Count
	Sections
	Advanced Automation Systems
	12 systems
	Section 2
	New Database Schemas (additions)
	11 tables / collections
	Section 3
	New & Extended API Endpoints
	70+ endpoints
	Section 4
	New Frontend Screens
	13 screens
	Section 5
	Extended Commerce Features
	8 features
	Section 6
	Search & Discovery System
	1 full system
	Section 7
	Notification & Communication System
	1 full system
	Section 8
	Customer Community Features
	4 features
	Section 9
	Affiliate & Referral Program
	1 full system
	Section 10
	External Integration & Webhooks
	1 full system
	Section 11
	Content Intelligence & Versioning
	3 systems
	Section 12
	Operations & Compliance
	4 systems
	Section 13
	________________


2. Advanced Automation Systems
The automation layer described in PRD v1 covers basic cron-triggered generation. This section specifies twelve additional intelligent automation systems that transform the platform from a scheduled factory into a self-optimising content engine. Each system is defined with its trigger mechanism, data inputs, processing logic, outputs, and failure handling.


2.1 Smart Auto-Approval Engine
Currently all content must pass through human review. The Smart Auto-Approval Engine analyses historical reviewer decisions to build a model that can approve content autonomously when confidence is sufficiently high, reserving human review for edge cases and borderline items.
How It Works
After each reviewer decision, the system stores the content item alongside its decision vector: quality score, category, word count, tag overlap with previously approved items in the same category, and structural metrics (for scripts: has hook, has CTA; for social: hashtag count, emoji ratio). After 500 labelled decisions per content type, a logistic regression classifier is trained weekly and evaluated against a held-out validation set.
Thresholds & Configuration
Setting
	Default Value
	Admin Configurable?
	Minimum training samples to activate
	500 per content type
	No (hardcoded safety floor)
	Auto-approve confidence threshold
	0.94 (94%)
	Yes — slider in Settings
	Auto-reject confidence threshold
	0.90 (90%)
	Yes — slider in Settings
	Items between model re-evaluations
	200 new decisions
	Yes
	Human sample rate (approved items)
	10% spot-check rate
	Yes
	Content types eligible for auto-approval
	prompts, social_posts (initially)
	Yes
	Workflow
1. New content item saved to MongoDB with status='pending'.
2. AutoApprovalService.evaluate(item) called synchronously before creating Approval PG record.
3. If confidence ≥ auto-approve threshold: status set to 'auto_approved'; no Approval record created; item immediately eligible for product packs.
4. If confidence ≤ auto-reject threshold: status set to 'auto_rejected'; rejection reason stored; item logged for model training.
5. Otherwise: normal Approval record created for human review.
6. 10% of auto-approved items randomly flagged for spot-check; added to a 'spot_check' queue visible to reviewers.
7. Model performance metrics (precision, recall, false positive rate) logged weekly to generation_logs.
New MongoDB Collection: auto_approval_decisions
{
  _id:             ObjectId,
  content_id:      String,
  content_type:    String,
  confidence:      Number,       // 0.0 – 1.0
  predicted_label: String,       // 'approved' | 'rejected' | 'human_review'
  feature_vector:  Object,       // inputs fed to model
  model_version:   String,
  was_spot_checked:Boolean,
  spot_check_outcome: String,    // 'correct' | 'wrong' | null
  created_at:      Date
}


2.2 Trend Intelligence Engine
Instead of generating content on static schedules with generic prompts, the Trend Intelligence Engine monitors external signals — search trends, social media momentum, and content platform patterns — and automatically adjusts generation targets to match what audiences are currently seeking.
Data Sources
Source
	Data Fetched
	Frequency
	Google Trends API
	Rising queries in categories: art, marketing, video, tech, lifestyle
	Every 6 hours
	Twitter/X Trending API
	Top 50 trending hashtags in configured locales
	Every 2 hours
	YouTube Data API (trending)
	Top 20 trending video topics per category
	Daily at 06:00 UTC
	Reddit (r/midjourney, r/ChatGPT, etc.)
	Top posts by upvote velocity (past 24h)
	Every 4 hours
	Platform internal data
	Which product types are selling, search queries on marketplace
	Continuous
	Processing Logic
The TrendAnalysisService aggregates all incoming signals into a ranked topic list. Each topic is scored by: signal frequency across sources (normalised 0–100), trend velocity (rising vs. stable vs. declining), content gap (how much approved content exists in this topic in our library — inverse score rewards underserved topics), and commercial potential (topics that historically convert to sales score higher). Topics with a combined score above 70 are flagged as 'hot topics' and automatically queued as generation targets for the next scheduled run.
Generation Integration
The GenerationScheduler reads hot topics before each cron run and passes them as contextual hints to the LLM prompt. For example, instead of 'Generate 50 art prompts', the system sends 'Generate 50 art prompts with emphasis on: [trending topic 1], [trending topic 2], [trending topic 3]'. This requires no structural change to existing generation modules — only the system prompt construction is extended.
New MongoDB Collection: trend_signals
{
  _id:          ObjectId,
  topic:        String,
  source:       String,          // google_trends|twitter|youtube|reddit|internal
  score:        Number,          // 0–100 composite score
  velocity:     String,          // rising|stable|declining
  content_gap:  Number,          // 0–100 (100 = completely underserved)
  used_in_batch:Boolean,
  batch_id:     String,
  expires_at:   Date,            // 48h TTL
  created_at:   Date
}


2.3 Content Repurposing Engine
One of the most valuable automation capabilities is converting a single high-quality content item into multiple formats. A well-performing YouTube script can be automatically repurposed into social media captions, a thread of prompts, and a poster concept — multiplying the value of each approved item without additional generation cost.
Repurposing Matrix
Source Type
	Can Generate
	Trigger Condition
	Approved Script
	5 Instagram captions, 3 Twitter threads, 1 YouTube Short script, 2 Prompt ideas
	Script quality_score ≥ 85 AND auto-triggered post-approval
	Approved Prompt
	3 poster themes, 2 social posts describing the image concept
	Prompt quality_score ≥ 80
	Approved Poster
	3 Instagram captions for the image, 1 Pinterest description, 2 related prompts
	Poster manually flagged by reviewer OR auto if score ≥ 85
	Approved Social Post
	1 blog intro paragraph, 3 prompt variations on same theme
	Social post has hashtag_count ≥ 8 AND engagement_score ≥ 75
	Deduplication Guard
All repurposed items are passed through the Content Deduplication System (Section 2.4) before being saved. Items with cosine similarity > 0.88 against existing approved content are discarded. Repurposed items are tagged with source_id pointing to the original content and repurpose_type label so reviewers can context-collapse them in the review queue.


2.4 Content Deduplication System
Without deduplication, LLM generation inevitably produces near-identical content at scale. The deduplication system uses sentence embeddings to compute semantic similarity across all content and rejects or flags items that are too similar to existing approved content.
Technical Approach
Every content item has its text converted to a 1536-dimension vector embedding using the text-embedding-3-small model (OpenAI). Vectors are stored in a pgvector extension on PostgreSQL (separate from MongoDB). On each new batch, cosine similarity is computed between each new item and the nearest 50 vectors in the same category. Items exceeding the similarity threshold are automatically rejected and logged.
Parameter
	Value
	Notes
	Embedding model
	text-embedding-3-small
	1536 dimensions, cost-efficient
	Similarity threshold — auto-reject
	> 0.92
	Extremely similar, likely duplicate
	Similarity threshold — flag for review
	0.80 – 0.92
	Similar but may be acceptable variant
	Comparison scope
	All approved + pending in same category
	Approved take priority
	Storage
	pgvector table: content_embeddings
	Index type: ivfflat, lists=100
	New PostgreSQL Table: content_embeddings
CREATE TABLE content_embeddings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id   VARCHAR(100) NOT NULL UNIQUE,  -- MongoDB ObjectId
  content_type VARCHAR(50)  NOT NULL,
  category     VARCHAR(100) NOT NULL,
  embedding    vector(1536) NOT NULL,          -- pgvector type
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON content_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);


2.5 Performance Feedback Loop
The generation system currently has no awareness of which content types, categories, and styles are commercially successful. The Performance Feedback Loop closes this gap by continuously feeding sales and download data back into generation parameters, so the factory naturally produces more of what sells.
Feedback Signals
Signal
	Weight
	Update Frequency
	Product pack purchase count (by category)
	40%
	Daily
	Product pack download rate after purchase
	15%
	Daily
	Marketplace preview download rate (by type)
	10%
	Daily
	Review approval rate by category
	20%
	Per batch
	Marketplace search click-through rate by tag
	15%
	Daily
	Output: Generation Priority Matrix
A GenerationPriorityService computes a category weight table weekly. This table is consumed by GenerationScheduler to dynamically allocate generation tokens across categories. For example, if 'cinematic' prompts have a purchase rate 3x higher than 'food' prompts, the next weekly generation run might allocate 40% of prompt generation budget to cinematic and 10% to food, rather than spreading evenly.


2.6 Auto-Regeneration on Rejection
When a reviewer rejects a content item with a reason, that reason contains implicit information about what made the item inadequate. The Auto-Regeneration System uses rejection reasons to construct an improved prompt and immediately schedules a regeneration attempt for that slot, ensuring the batch quota is eventually filled with quality content.
Rejection Reason Classification
Rejection Reason Pattern
	Prompt Improvement Strategy
	'Too generic', 'lacks detail', 'vague'
	Add specificity instruction: 'Be extremely specific and detailed. Avoid generic phrasing.'
	'Duplicate', 'similar to existing'
	Add novelty instruction + inject 3 random dissimilar approved items as negative examples
	'Wrong category'
	Correct the category in the generation prompt explicitly
	'Too short', 'insufficient content'
	Add minimum word count instruction; increase token budget 50%
	'Inappropriate', 'off-brand'
	Add content policy reinforcement to system prompt; route to higher-temperature generation
	'Poor formatting' (scripts)
	Add explicit structural template to the prompt
	Custom reviewer note
	Extract key nouns from the note and include as 'avoid: [terms]' instruction
	Workflow
1. Reviewer submits rejection with reason text.
2. RejectionClassifierService categorises the reason into one of the patterns above.
3. A regeneration task is pushed to the Bull queue with: content_type, original_prompt, improved_system_prompt, category, batch_id='regen_[original_batch_id]'.
4. Queue worker processes the task within 5 minutes; new item created in MongoDB.
5. New item enters normal review queue (not auto-approved, regardless of score).
6. Regeneration cycle capped at 3 attempts per original rejection; after 3 failures, slot is abandoned and logged.


2.7 Dynamic Pricing Engine
Static prices set at product creation time leave revenue on the table. The Dynamic Pricing Engine monitors demand signals and recommends — or optionally applies automatically — price adjustments to maximise revenue without harming conversion rates.
Pricing Signals
Signal
	Price Direction
	Magnitude
	Purchase velocity > 2x weekly average
	Increase
	+5% to +20% based on multiplier
	No purchases in 14 days (non-new product)
	Decrease
	-10% to -25%
	Product in top 3 search results AND high CTR
	Increase
	+5% to +10%
	Competing product launched at lower price
	Decrease
	Match to within 10%
	Product age > 90 days (lifecycle discount)
	Decrease
	-15% after 90 days, -30% after 180 days
	Weekend / promotional period active
	Decrease
	Apply promo rate (see Section 6.2)
	Safety Guardrails
* Price can never drop below the admin-configured floor price (default: $0.99).
* Price can never increase more than 50% above the original price without explicit admin approval.
* All price changes are logged in a price_history PostgreSQL table.
* Admin receives a daily digest email listing all automatic price changes.
* Admin can toggle the engine to 'recommendation only' mode (no automatic changes).


2.8 Automated SEO Metadata Generation
Every product published to the marketplace needs SEO-optimised metadata to be discoverable via search engines. Currently admins write this manually. The SEO Automation module generates title tags, meta descriptions, URL slugs, structured data (JSON-LD), and Open Graph tags automatically for every product at publish time.
Generated Assets Per Product
Asset
	Max Length
	Generation Method
	SEO title tag
	60 characters
	LLM: '{product_title} | {item_count} {type} | AI Content Factory'
	Meta description
	160 characters
	LLM: summarise product benefits; include primary keyword
	URL slug
	80 characters
	Deterministic: kebab-case of title + type suffix
	Focus keywords
	5 terms
	Extracted from product tags + category + LLM keyword expansion
	JSON-LD Product schema
	Full schema
	Auto-populated: name, description, offers, image, aggregateRating
	Open Graph tags
	og:title, og:description, og:image, og:type
	Derived from SEO title, meta desc, thumbnail_url
	Twitter Card tags
	summary_large_image
	Same as OG, with Twitter-specific tags
	Alt text for thumbnail
	125 characters
	LLM: describe the thumbnail image content
	

2.9 Automated Email Campaign Triggers
The platform should communicate with customers at the right moments automatically, without admin intervention. A set of trigger-based email workflows fire in response to specific user actions or time-based conditions.
Trigger Event
	Email Sent To
	Delay
	Email Content
	User registers
	New user
	Immediately
	Welcome + 10% first-purchase coupon
	User registers but no purchase in 3 days
	New user
	72h post-register
	Featured products + social proof
	Cart abandoned (checkout started, not completed)
	Logged-in user
	1h + 24h
	Reminder + 'Still interested?' subject line
	Order paid
	Customer
	Immediately
	Order confirmation + download links
	New product published (type matches past purchases)
	Past customers
	Daily batch at 10:00 UTC
	Personalised 'New for you' product announcement
	Download limit approaching (4th download)
	Customer
	Immediately
	Warning: 1 download remaining; purchase again link
	Product the user wishlisted goes on sale
	User
	Immediately on price drop
	Price drop alert with CTA
	Reviewer has 10+ items in queue, none reviewed for 48h
	Reviewer
	Every 48h
	Nudge: pending items summary
	Product purchased 7 days ago, no review left
	Customer
	Day 7 post-purchase
	Request a review CTA
	Affiliate commission earned
	Affiliate
	Daily batch at 08:00 UTC
	Earnings summary + payout status
	

2.10 Inventory & Lifecycle Management
Products do not have infinite shelf life. Content becomes outdated, oversaturated, or simply stops selling. The Inventory & Lifecycle Management system automates the full product lifecycle from published to archived to replaced.
Lifecycle States & Transitions
draft → published  (admin action)
published → featured  (auto: purchase velocity rank top 10%)
featured → published  (auto: velocity drops out of top 10% for 14 days)
published → on_sale  (auto: pricing engine or admin promo trigger)
on_sale → published  (auto: promo period ends)
published → sunset_warned  (auto: no sales in 60 days)
sunset_warned → archived  (auto: no sales in next 30 days after warning)
archived → deleted  (admin manual action only)
Automation Rules
* Products with zero purchases for 60 consecutive days are flagged as 'sunset_warned'. Admin is notified via dashboard alert and email.
* If still zero purchases 30 days after the warning, the product is automatically archived (hidden from marketplace but still accessible via direct URL for existing purchasers).
* When a product is archived, the system checks if its component content items are still valid and, if so, queues them as candidates for inclusion in a new, refreshed product pack.
* Bestsellers (top 5% by purchase velocity) are automatically tagged as 'featured' and displayed first in marketplace listings.


2.11 Bulk Processing Queue (Bull / BullMQ)
Several operations — PDF generation, ZIP creation, large batch generation, embedding computation, repurposing, regeneration — are computationally expensive and should not block the HTTP request cycle. PRD v1 did not specify a job queue system. This section defines the complete Bull queue architecture.
Queues & Workers
Queue Name
	Concurrency
	Jobs Processed
	Retry Strategy
	ai-generation
	3
	LLM API calls for all content types
	3 retries, exponential backoff 10s/30s/120s
	content-embedding
	5
	Vector embedding computation for deduplication
	2 retries, 5s delay
	product-builder
	2
	PDF generation, ZIP creation, S3 upload
	2 retries, 30s delay
	repurposing
	4
	Content repurposing engine jobs
	2 retries, 10s delay
	email
	10
	All outbound emails via Nodemailer
	5 retries, 15s delay
	seo-generation
	5
	Metadata generation per product publish
	2 retries, 10s delay
	trend-ingestion
	2
	External trend API data fetching
	3 retries, 60s delay
	pricing-engine
	1
	Price evaluation and adjustment
	No retry (idempotent)
	notifications
	10
	In-app notification delivery
	3 retries, 5s delay
	webhook-dispatch
	8
	Outbound webhook event dispatch
	5 retries with exponential backoff
	Queue Dashboard
A Bull Board UI is mounted at /admin/queues (admin-only, separate auth middleware). It shows real-time job counts (waiting, active, completed, failed, delayed) per queue, job details with full payload and error trace for failed jobs, and manual retry controls. Queue health metrics are also surfaced on the System Health Monitor screen (Section 5.12).


2.12 Automated Content Quality Evolution
Over time, the quality bar should rise automatically. The Quality Evolution system tracks the distribution of quality scores across approved content and slowly raises the minimum quality threshold for auto-approval as the library grows and historical data proves that higher thresholds do not reduce throughput below acceptable levels.
Adaptive Threshold Logic
Every two weeks, the system evaluates the rolling 30-day distribution of quality scores for items that were both approved by reviewers and subsequently included in products that achieved purchases. If the 25th percentile of that distribution is above the current minimum threshold by more than 5 points, the threshold is raised by 3 points (e.g. from 75 to 78). The threshold can never be raised more than 15 points above the admin-configured baseline in a single calendar quarter, and it can never exceed 90. This ensures the system tightens quality naturally without ever locking itself into a state where almost nothing passes.
________________


3. Additional Database Schemas
The following tables and collections extend the database design from PRD v1 Section 5. None of these duplicate existing schemas. All PostgreSQL tables follow the same conventions (UUID PKs, TIMESTAMPTZ, soft deletes where applicable).


3.1 PostgreSQL Additions
3.1.1 Table: coupons
Column
	Type
	Constraints
	Description
	id
	UUID
	PK
	

	code
	VARCHAR(50)
	NOT NULL, UNIQUE, UPPER
	Promo code e.g. LAUNCH20
	type
	ENUM
	NOT NULL
	percentage | fixed_amount | free_shipping
	value
	DECIMAL(10,2)
	NOT NULL
	20 for 20%, or 5.00 for $5 off
	min_order_value
	DECIMAL(10,2)
	NULLABLE
	Minimum cart total to apply code
	max_discount_value
	DECIMAL(10,2)
	NULLABLE
	Cap on percentage discounts
	applicable_product_ids
	UUID[]
	NULLABLE
	NULL = applies to all products
	applicable_product_types
	TEXT[]
	NULLABLE
	NULL = all types
	usage_limit_total
	INTEGER
	NULLABLE
	Max total redemptions; NULL = unlimited
	usage_limit_per_user
	INTEGER
	NOT NULL, DEFAULT 1
	Times one user can use this code
	usage_count
	INTEGER
	NOT NULL, DEFAULT 0
	Running total redemptions
	starts_at
	TIMESTAMPTZ
	NOT NULL
	Code active from
	expires_at
	TIMESTAMPTZ
	NULLABLE
	NULL = never expires
	is_active
	BOOLEAN
	NOT NULL, DEFAULT TRUE
	Admin kill switch
	created_by
	UUID
	FK → users.id
	

	created_at
	TIMESTAMPTZ
	NOT NULL, DEFAULT NOW()
	

	

3.1.2 Table: coupon_redemptions
Column
	Type
	Constraints
	Description
	id
	UUID
	PK
	

	coupon_id
	UUID
	FK → coupons.id, NOT NULL
	

	user_id
	UUID
	FK → users.id, NOT NULL
	

	order_id
	UUID
	FK → orders.id, NOT NULL, UNIQUE
	One coupon per order
	discount_applied
	DECIMAL(10,2)
	NOT NULL
	Actual discount amount deducted
	redeemed_at
	TIMESTAMPTZ
	NOT NULL, DEFAULT NOW()
	

	

3.1.3 Table: product_bundles
Column
	Type
	Constraints
	Description
	id
	UUID
	PK
	

	title
	VARCHAR(300)
	NOT NULL
	Bundle display name
	slug
	VARCHAR(320)
	NOT NULL, UNIQUE
	

	description
	TEXT
	NOT NULL
	

	bundle_price
	DECIMAL(10,2)
	NOT NULL
	Discounted bundle total
	individual_total
	DECIMAL(10,2)
	NOT NULL
	Sum of all included product prices
	discount_percentage
	DECIMAL(5,2)
	NOT NULL
	Computed: (1 - bundle/individual) * 100
	thumbnail_url
	TEXT
	NULLABLE
	

	status
	ENUM
	NOT NULL, DEFAULT 'draft'
	draft | published | archived
	product_ids
	UUID[]
	NOT NULL
	Array of included product IDs
	purchase_count
	INTEGER
	NOT NULL, DEFAULT 0
	

	created_by
	UUID
	FK → users.id
	

	created_at
	TIMESTAMPTZ
	NOT NULL
	

	updated_at
	TIMESTAMPTZ
	NOT NULL
	

	

3.1.4 Table: wishlists
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
	

	product_id
	UUID
	FK → products.id, NULLABLE
	NULL if bundle
	bundle_id
	UUID
	FK → product_bundles.id, NULLABLE
	NULL if product
	added_at
	TIMESTAMPTZ
	NOT NULL, DEFAULT NOW()
	

	Constraint:  CHECK ((product_id IS NOT NULL AND bundle_id IS NULL) OR (product_id IS NULL AND bundle_id IS NOT NULL))


3.1.5 Table: product_reviews
Column
	Type
	Constraints
	Description
	id
	UUID
	PK
	

	product_id
	UUID
	FK → products.id, NOT NULL
	

	user_id
	UUID
	FK → users.id, NOT NULL
	

	order_id
	UUID
	FK → orders.id, NOT NULL
	Validates purchase entitlement
	rating
	SMALLINT
	NOT NULL, CHECK 1–5
	Star rating
	title
	VARCHAR(200)
	NULLABLE
	Review headline
	body
	TEXT
	NULLABLE
	Full review text
	is_verified_purchase
	BOOLEAN
	NOT NULL, DEFAULT TRUE
	Always true (review gated by order)
	is_featured
	BOOLEAN
	NOT NULL, DEFAULT FALSE
	Admin can feature on product page
	status
	ENUM
	NOT NULL, DEFAULT 'published'
	published | hidden | flagged
	helpful_count
	INTEGER
	NOT NULL, DEFAULT 0
	Upvotes from other customers
	created_at
	TIMESTAMPTZ
	NOT NULL
	

	Constraint:  UNIQUE(product_id, user_id) — one review per purchase. INDEX(product_id, rating) for aggregate queries.


3.1.6 Table: affiliates
Column
	Type
	Constraints
	Description
	id
	UUID
	PK
	

	user_id
	UUID
	FK → users.id, NOT NULL, UNIQUE
	The affiliate's user account
	referral_code
	VARCHAR(20)
	NOT NULL, UNIQUE
	e.g. JOHN2026
	commission_rate
	DECIMAL(5,4)
	NOT NULL, DEFAULT 0.20
	20% default; up to 40% for VIP
	status
	ENUM
	NOT NULL, DEFAULT 'pending'
	pending | active | suspended | terminated
	payout_method
	ENUM
	NULLABLE
	paypal | bank_transfer | stripe
	payout_email
	VARCHAR(255)
	NULLABLE
	PayPal email or bank details reference
	total_earned
	DECIMAL(10,2)
	NOT NULL, DEFAULT 0
	Running lifetime earnings
	total_paid_out
	DECIMAL(10,2)
	NOT NULL, DEFAULT 0
	Running lifetime payouts
	pending_balance
	DECIMAL(10,2)
	NOT NULL, DEFAULT 0
	Earned but not yet paid
	minimum_payout
	DECIMAL(10,2)
	NOT NULL, DEFAULT 20.00
	$20 minimum payout threshold
	created_at
	TIMESTAMPTZ
	NOT NULL
	

	approved_at
	TIMESTAMPTZ
	NULLABLE
	When admin approved the affiliate
	

3.1.7 Table: affiliate_conversions
Column
	Type
	Constraints
	Description
	id
	UUID
	PK
	

	affiliate_id
	UUID
	FK → affiliates.id, NOT NULL
	

	order_id
	UUID
	FK → orders.id, NOT NULL, UNIQUE
	Each order attributed to max 1 affiliate
	referred_user_id
	UUID
	FK → users.id, NOT NULL
	The customer who purchased
	order_total
	DECIMAL(10,2)
	NOT NULL
	Order value at conversion time
	commission_rate
	DECIMAL(5,4)
	NOT NULL
	Rate at time of conversion (snapshot)
	commission_amount
	DECIMAL(10,2)
	NOT NULL
	Earned commission in USD
	status
	ENUM
	NOT NULL, DEFAULT 'pending'
	pending | approved | paid | reversed
	approved_at
	TIMESTAMPTZ
	NULLABLE
	After 30-day refund window
	paid_at
	TIMESTAMPTZ
	NULLABLE
	

	converted_at
	TIMESTAMPTZ
	NOT NULL
	Order creation time
	

3.1.8 Table: notifications
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
	Recipient
	type
	VARCHAR(80)
	NOT NULL
	e.g. new_product, order_paid, review_received
	title
	VARCHAR(200)
	NOT NULL
	Short notification title
	body
	TEXT
	NULLABLE
	Full notification text
	action_url
	TEXT
	NULLABLE
	Deep link e.g. /orders/:id
	is_read
	BOOLEAN
	NOT NULL, DEFAULT FALSE
	

	read_at
	TIMESTAMPTZ
	NULLABLE
	

	channel
	TEXT[]
	NOT NULL
	Channels delivered: ['in_app','email','push']
	metadata
	JSONB
	NULLABLE
	Type-specific payload
	created_at
	TIMESTAMPTZ
	NOT NULL
	

	

3.1.9 Table: webhooks
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
	Owner (admin/developer)
	name
	VARCHAR(100)
	NOT NULL
	Label e.g. 'My Zapier Hook'
	url
	TEXT
	NOT NULL
	Target URL for POST
	secret
	VARCHAR(255)
	NOT NULL
	HMAC-SHA256 signing secret (shown once)
	events
	TEXT[]
	NOT NULL
	Subscribed event types
	is_active
	BOOLEAN
	NOT NULL, DEFAULT TRUE
	

	last_triggered_at
	TIMESTAMPTZ
	NULLABLE
	

	last_status_code
	INTEGER
	NULLABLE
	HTTP status from last delivery
	failure_count
	INTEGER
	NOT NULL, DEFAULT 0
	Consecutive failures
	created_at
	TIMESTAMPTZ
	NOT NULL
	

	

3.1.10 Table: price_history
Column
	Type
	Constraints
	Description
	id
	UUID
	PK
	

	product_id
	UUID
	FK → products.id, NOT NULL
	

	old_price
	DECIMAL(10,2)
	NOT NULL
	

	new_price
	DECIMAL(10,2)
	NOT NULL
	

	change_reason
	VARCHAR(200)
	NOT NULL
	e.g. 'dynamic_engine', 'admin_manual', 'promo'
	changed_by
	VARCHAR(100)
	NOT NULL
	'system' or user UUID
	changed_at
	TIMESTAMPTZ
	NOT NULL
	

	

3.1.11 Table: audit_logs
Column
	Type
	Constraints
	Description
	id
	UUID
	PK
	

	actor_id
	UUID
	FK → users.id, NULLABLE
	NULL = system action
	actor_role
	VARCHAR(50)
	NOT NULL
	Role at time of action
	action
	VARCHAR(100)
	NOT NULL
	e.g. 'product.publish', 'user.role_changed'
	entity_type
	VARCHAR(80)
	NOT NULL
	e.g. 'Product', 'User', 'Coupon'
	entity_id
	VARCHAR(100)
	NOT NULL
	UUID or MongoDB ObjectId
	old_value
	JSONB
	NULLABLE
	State before change
	new_value
	JSONB
	NULLABLE
	State after change
	ip_address
	INET
	NULLABLE
	

	user_agent
	TEXT
	NULLABLE
	

	created_at
	TIMESTAMPTZ
	NOT NULL
	

	

3.2 New MongoDB Collections
3.2.1 Collection: content_versions
{
  _id:              ObjectId,
  content_id:       String,      // reference to original content ObjectId
  content_type:     String,      // prompt|script|poster|social_post
  version_number:   Number,      // 1, 2, 3 ... increments on each edit
  snapshot:         Object,      // full content document at this version
  change_summary:   String,      // what changed in this version
  changed_by:       String,      // user UUID or 'auto_regen' or 'repurpose_engine'
  created_at:       Date
}


3.2.2 Collection: search_analytics
{
  _id:            ObjectId,
  query:          String,        // raw search string
  normalised:     String,        // lowercased, stemmed
  result_count:   Number,
  clicked_ids:    [String],      // product IDs clicked
  converted:      Boolean,       // did session result in purchase?
  session_id:     String,
  user_id:        String,        // null if guest
  created_at:     Date
}
________________


4. New & Extended API Endpoints
All endpoints below are new additions to the API defined in PRD v1 Section 7. Base prefix remains /api/v1. The same auth, validation, and error-format conventions apply throughout.


4.1 Coupons
Method
	Endpoint
	Auth
	Description
	POST
	/coupons
	Admin
	Create a new coupon code
	GET
	/coupons
	Admin
	List all coupons (filter by status, type, active)
	GET
	/coupons/:id
	Admin
	Single coupon details + redemption history
	PATCH
	/coupons/:id
	Admin
	Update coupon settings (can't change code)
	DELETE
	/coupons/:id
	Admin
	Deactivate coupon (soft)
	POST
	/coupons/validate
	JWT
	Validate code + return discount preview: { valid, discountAmount, finalTotal }
	GET
	/coupons/:id/redemptions
	Admin
	Paginated list of all redemptions for a code
	GET
	/coupons/stats/overview
	Admin
	Revenue recovered via coupons, top codes, conversion lift
	

4.2 Product Bundles
Method
	Endpoint
	Auth
	Description
	POST
	/bundles
	Admin
	Create bundle: { title, description, product_ids, bundle_price, thumbnail_url }
	GET
	/bundles
	Public
	List published bundles (marketplace)
	GET
	/bundles/:id
	Public
	Bundle detail with included product cards
	PATCH
	/bundles/:id
	Admin
	Update bundle metadata
	PATCH
	/bundles/:id/publish
	Admin
	Publish bundle to marketplace
	PATCH
	/bundles/:id/archive
	Admin
	Archive bundle
	GET
	/bundles/admin/list
	Admin
	All bundles including draft/archived
	

4.3 Wishlist
Method
	Endpoint
	Auth
	Description
	GET
	/wishlist
	JWT
	Get current user's full wishlist with product data
	POST
	/wishlist/products/:productId
	JWT
	Add product to wishlist
	POST
	/wishlist/bundles/:bundleId
	JWT
	Add bundle to wishlist
	DELETE
	/wishlist/products/:productId
	JWT
	Remove product
	DELETE
	/wishlist/bundles/:bundleId
	JWT
	Remove bundle
	GET
	/wishlist/count
	JWT
	Fast count for nav badge
	

4.4 Reviews
Method
	Endpoint
	Auth
	Description
	POST
	/reviews
	JWT
	Submit review: { product_id, order_id, rating, title, body }
	GET
	/reviews/products/:productId
	Public
	Paginated reviews for a product (sorted by helpful_count, recency)
	GET
	/reviews/me
	JWT
	Customer's own review history
	PATCH
	/reviews/:id
	JWT (owner)
	Edit own review (within 30 days)
	DELETE
	/reviews/:id
	Admin
	Hide/delete a review
	POST
	/reviews/:id/helpful
	JWT
	Mark review as helpful (+1 helpful_count)
	POST
	/reviews/:id/flag
	JWT
	Flag review for admin moderation
	GET
	/reviews/admin/flagged
	Admin
	All flagged reviews pending moderation
	PATCH
	/reviews/:id/feature
	Admin
	Toggle featured status
	

4.5 Search
Method
	Endpoint
	Auth
	Description
	GET
	/search?q=&type=&minPrice=&maxPrice=&tags=&sort=&page=
	Public
	Full-text product + bundle search with faceted filters
	GET
	/search/suggestions?q=
	Public
	Autocomplete: return top 8 matching titles as user types
	GET
	/search/trending
	Public
	Top 10 search queries from past 7 days
	GET
	/search/analytics
	Admin
	Query volume, zero-result queries, conversion rate by query
	POST
	/search/reindex
	Admin
	Trigger manual Elasticsearch index rebuild
	

4.6 Affiliates
Method
	Endpoint
	Auth
	Description
	POST
	/affiliates/apply
	JWT
	Apply to become an affiliate (status → pending)
	GET
	/affiliates/me
	JWT (affiliate)
	Own affiliate dashboard data
	GET
	/affiliates/me/conversions
	JWT (affiliate)
	Own conversion history
	GET
	/affiliates/me/payouts
	JWT (affiliate)
	Own payout history + pending balance
	POST
	/affiliates/me/payout-request
	JWT (affiliate)
	Request payout (if balance ≥ minimum)
	GET
	/affiliates
	Admin
	All affiliates (filter by status)
	PATCH
	/affiliates/:id/approve
	Admin
	Approve affiliate application
	PATCH
	/affiliates/:id/suspend
	Admin
	Suspend affiliate access
	PATCH
	/affiliates/:id/commission
	Admin
	{ commission_rate } — update rate
	GET
	/affiliates/:id/conversions
	Admin
	All conversions for one affiliate
	POST
	/affiliates/:id/payout
	Admin
	Mark payout as processed + amount
	GET
	/affiliates/stats/overview
	Admin
	Total affiliates, total commissions paid, top performers
	

4.7 Notifications
Method
	Endpoint
	Auth
	Description
	GET
	/notifications
	JWT
	Current user's notifications (paginated, filter unread)
	GET
	/notifications/count
	JWT
	Unread count for nav badge
	PATCH
	/notifications/:id/read
	JWT
	Mark single notification as read
	PATCH
	/notifications/read-all
	JWT
	Mark all as read
	DELETE
	/notifications/:id
	JWT
	Delete a notification
	GET
	/notifications/preferences
	JWT
	User's channel preferences per notification type
	PATCH
	/notifications/preferences
	JWT
	Update preferences { type: { in_app, email, push } }
	

4.8 Webhooks (External Integrations)
Method
	Endpoint
	Auth
	Description
	POST
	/webhooks
	Admin
	Register a webhook endpoint
	GET
	/webhooks
	Admin
	List all registered webhooks
	GET
	/webhooks/:id
	Admin
	Webhook details + delivery logs
	PATCH
	/webhooks/:id
	Admin
	Update URL, events, or active status
	DELETE
	/webhooks/:id
	Admin
	Remove webhook registration
	POST
	/webhooks/:id/test
	Admin
	Send test event payload to webhook URL
	GET
	/webhooks/:id/deliveries
	Admin
	Paginated delivery log with status codes and response bodies
	POST
	/webhooks/:id/deliveries/:deliveryId/retry
	Admin
	Manually retry a failed delivery
	

4.9 Automation Controls (Admin)
Method
	Endpoint
	Auth
	Description
	GET
	/automation/config
	Admin
	All automation settings (thresholds, schedules, flags)
	PATCH
	/automation/config
	Admin
	Update any automation configuration value
	GET
	/automation/smart-approval/stats
	Admin
	Auto-approval model precision, recall, confusion matrix
	POST
	/automation/smart-approval/retrain
	Admin
	Force immediate model retrain
	GET
	/automation/trends/hot-topics
	Admin
	Current hot topics list with scores
	POST
	/automation/trends/refresh
	Admin
	Force trend data refresh
	GET
	/automation/feedback-loop/matrix
	Admin
	Current generation priority matrix
	POST
	/automation/regen-rejected
	Admin
	Manually trigger regeneration for all rejected items in a batch
	GET
	/automation/pricing/recommendations
	Admin
	Current pricing engine recommendations
	POST
	/automation/pricing/apply-all
	Admin
	Apply all pending pricing recommendations
	GET
	/automation/queue/stats
	Admin
	Bull queue job counts per queue (proxied from Bull Board)
	

4.10 Analytics & Reporting
Method
	Endpoint
	Auth
	Description
	GET
	/analytics/revenue?period=
	Admin
	Revenue breakdown: daily/weekly/monthly, by product type, by category
	GET
	/analytics/customers
	Admin
	Customer acquisition, retention rate, LTV, cohort analysis
	GET
	/analytics/content-performance
	Admin
	Which content categories drive most sales
	GET
	/analytics/funnel
	Admin
	Visitor → view → wishlist → purchase conversion funnel
	GET
	/analytics/affiliates
	Admin
	Affiliate-driven revenue, top referrers
	GET
	/analytics/automation
	Admin
	Generation cost vs revenue correlation, ROI by content type
	GET
	/analytics/search
	Admin
	Top queries, zero-result rate, search → purchase conversion
	POST
	/analytics/export
	Admin
	Generate CSV/Excel export of any analytics dataset
	

4.11 Audit Logs
Method
	Endpoint
	Auth
	Description
	GET
	/audit-logs
	Admin
	Paginated audit log (filter: actor, action, entity_type, date range)
	GET
	/audit-logs/:id
	Admin
	Single audit event detail with full old/new value diff
	GET
	/audit-logs/export
	Super Admin
	CSV export of filtered audit entries
	________________


5. New Frontend Screens
The six screens defined in PRD v1 cover the primary admin workflow. The following thirteen screens complete the application's surface area — covering customer self-service, advanced admin intelligence, operational visibility, and the marketplace discovery experience.


5.1 Screen 8 — Analytics & Revenue Intelligence
Route: /admin/analytics  |  Access: Admin, Super Admin
Purpose
A full business intelligence centre giving admins deep visibility into revenue trends, customer behaviour, content-to-cash correlation, and platform health — all in one screen without needing external analytics tools.
Layout & Zones
Zone
	Content & Interaction
	Date Range Selector (sticky top)
	Quick selectors: Today, Last 7d, Last 30d, Last 90d, Year-to-date, Custom range — applies to all widgets
	Revenue Summary Row
	Total Revenue (period) | MRR | ARR | Average Order Value | Refund Rate — each as a KPI card with sparkline
	Revenue Chart (60% width)
	Stacked area chart: revenue by product type (prompt_pack, poster_pack, script_pack, social_pack) over time. Toggle: daily / weekly / monthly.
	Top Products Leaderboard (40% width)
	Bar chart: top 10 products by revenue in period. Click bar → navigates to product detail.
	Customer Cohort Table
	Acquisition month on X-axis vs retention months on Y-axis. Cell = % of cohort still purchasing. Heat-mapped green → red.
	Conversion Funnel
	5-step funnel visualisation: Unique Visitors → Product Views → Add to Wishlist → Checkout Started → Order Paid. Drop-off % between each step.
	Content Performance Matrix
	Scatter plot: X = content category approval rate, Y = associated product purchase rate. Bubble size = content volume. Identifies high-value vs low-yield categories.
	Automation ROI Panel
	Token cost per batch type | Revenue attributable | ROI ratio | Cost trend
	Export Button
	Calls POST /analytics/export to download selected dataset as CSV or Excel
	

5.2 Screen 9 — Trend Intelligence Dashboard
Route: /admin/trends  |  Access: Admin, Super Admin
Purpose
Gives admins real-time visibility into the trend signals that the Trend Intelligence Engine is monitoring, and lets them manually steer generation topics beyond what the algorithm alone would produce.
Layout & Zones
Zone
	Content & Interaction
	Hot Topics Feed
	Live-updating card list of current trending topics sorted by composite score. Each card shows: topic name, source icons (G/T/YT/Reddit), score bar, content gap indicator, 'Pin to next batch' button.
	Source Signal Breakdown
	4 tabs (Google Trends / Twitter / YouTube / Reddit) each showing raw top signals from that source with timestamps and raw scores before normalisation.
	Generation Priority Matrix
	Visual heatmap of current category weight distribution. Colour saturation = priority. Admin can drag-adjust weights and save override.
	Topic Blacklist Manager
	Admin can blacklist specific topics or keywords from ever appearing in generation prompts. CRUD list with pattern matching support.
	Historical Trend Map
	Calendar heatmap showing topic density over time — which topics dominated which weeks — useful for seasonal planning.
	Manual Injection Panel
	Text input for admin to type a custom topic and inject it into the next generation run as a high-priority hint, bypassing algorithm.
	Trend-to-Sales Correlation
	Line chart: trending score of a topic (past 30 days) vs sales of content packs in that category (with ~7-day lag visualised).
	

5.3 Screen 10 — Content Library
Route: /admin/library  |  Access: Reviewer, Admin, Super Admin
Purpose
A unified, searchable, filterable view of every content item in the system across all types and statuses — not just the pending review queue. Essential for finding content, auditing what was generated, understanding what's been approved, and managing the content archive.
Layout & Zones
Zone
	Content & Interaction
	Filter Panel (left 22%)
	Content type checkboxes | Status multi-select (pending/approved/auto_approved/rejected/archived/in_product) | Category dropdown | Date range | Batch ID search | Quality score range slider | Generator model filter
	Results Grid (right 78%)
	Card or table toggle view. Card: shows type icon, truncated content, category badge, quality score pill, status badge, creation date, action buttons. Table: sortable columns.
	Sort Options
	Created At (default) | Quality Score | Category | Status | Batch ID
	Bulk Actions Bar
	Select all (filtered) | Bulk approve | Bulk reject | Bulk archive | Export selected as CSV
	Content Item Drawer
	Clicking any item opens a slide-over drawer with: full content preview, edit capability, version history timeline, approval history, 'Include in pack' shortcut button
	Version History Panel
	Within drawer: timeline of all versions (v1 → current), diff view between versions, who made each change
	Library Stats Bar (top)
	Pill counts: Total | Pending | Approved | Auto-approved | Rejected | In Product | Archived
	

5.4 Screen 11 — Coupon & Discount Manager
Route: /admin/coupons  |  Access: Admin, Super Admin
Layout & Zones
Zone
	Content & Interaction
	Page Header
	Title | 'Create Coupon' button (primary CTA, right-aligned)
	Summary Cards
	Active Coupons | Total Redemptions | Revenue Recovered via Coupons | Avg Discount Applied
	Coupons Table
	Code | Type | Value | Usage (used/limit) | Valid Period | Applicable To | Status badge | Actions (Edit, Deactivate, View Redemptions)
	Create/Edit Coupon Modal
	Fields: Code (auto-generate or custom) | Type selector | Value | Min order | Max discount | Product/type scope | Usage limits (total + per user) | Date range | Active toggle
	Redemption Detail Drawer
	Opens on 'View Redemptions' — table of all users who used the code: user email, order total, discount amount, redeemed at. Export CSV option.
	Coupon Performance Chart
	Bar chart: daily redemption count and associated revenue recovered for each active coupon in the selected period
	

5.5 Screen 12 — Product Bundle Builder
Route: /admin/bundles  |  Access: Admin, Super Admin
Layout & Zones
Zone
	Content & Interaction
	Bundle List View
	All bundles table: thumbnail, title, included product count, individual total, bundle price, discount %, status, sales count, actions
	Create Bundle Panel
	Step 1: Product Selector — searchable grid of published products with checkboxes. Shows selected total price updating live. Step 2: Bundle Config — title, description, set bundle price (auto-suggests 20% discount), thumbnail upload, SEO fields. Step 3: Preview & Publish.
	Bundle Price Calculator Widget
	Live calculator: as admin selects products, shows individual total, auto-suggests bundle price at various discount rates (15%, 20%, 25%, 30%), displays projected savings badge.
	Bundle Detail View
	Clicking a bundle shows: included product cards, purchase history, revenue generated, 'Edit Bundle' and 'Archive' actions.
	

5.6 Screen 13 — Affiliate Program (Admin View)
Route: /admin/affiliates  |  Access: Admin, Super Admin
Layout & Zones
Zone
	Content & Interaction
	Summary Cards
	Total Affiliates | Pending Applications | Total Commissions Paid (all time) | Revenue Attributed to Affiliates | Top Affiliate Earnings This Month
	Applications Queue
	Pending affiliate applications: user name, email, join date, social/website URLs if provided, Approve / Reject buttons with optional note
	Active Affiliates Table
	Name | Referral Code | Commission Rate | Conversions (month) | Pending Balance | Status | Actions: View Dashboard, Edit Rate, Suspend, Force Payout
	Payout Management
	Affiliates with pending balance ≥ $20: list with Approve Payout button. Payout history with status (pending/processed). Bulk payout trigger.
	Commission Settings Panel
	Default commission rate | VIP tier threshold (e.g. >$1000 earned → 30%) | Cookie duration (days) | Refund reversal window (days)
	Affiliate Performance Chart
	Line chart: revenue attributed per affiliate over time. Multi-series, toggleable by affiliate name.
	

5.7 Screen 14 — Notification Center (Admin + Customer)
Route: /notifications (in-app dropdown + dedicated page for customer) and /admin/notifications/broadcast (admin)
Customer Notification Center
Zone
	Content & Interaction
	Bell Icon (navbar)
	Shows unread count badge (calls GET /notifications/count). Click opens dropdown preview of latest 5 notifications with 'View All' link.
	Full Notifications Page (/notifications)
	Paginated list sorted by recency. Each item: icon (type-coded), title, body, time ago, action button (e.g. 'View Order'), read/unread indicator. Bulk 'Mark all read' button.
	Notification Preferences (/account/preferences#notifications)
	Toggle table: row = notification type (Order Paid, Price Drop, New Product, etc.), columns = In-App / Email / Push. Customer controls each channel per type.
	Admin Broadcast Panel (/admin/notifications/broadcast)
Zone
	Content & Interaction
	Audience Selector
	Target: All Users | All Customers | Specific Role | Users who purchased [product type] | Users with [tag]
	Message Composer
	Title field | Body textarea (markdown supported) | Action URL | Channel selector (in-app / email / push)
	Schedule Options
	Send now OR schedule for date/time
	Preview & Send
	Preview renders notification as it will appear, send to test address first, then broadcast
	Broadcast History
	Past broadcasts with: audience size, delivery count, open rate (for email), send time
	

5.8 Screen 15 — Customer Account Portal
Route: /account/*  |  Access: Authenticated Customers
Purpose
A complete self-service hub for customers to manage every aspect of their relationship with the platform — profile, purchases, downloads, wishlist, reviews, affiliate status, and preferences — without needing to contact support.
Sub-pages & Layout
Sub-page
	Route
	Content
	Profile
	/account/profile
	Name, email, avatar upload, password change, account deletion request, GDPR data export button
	Orders
	/account/orders
	Paginated order history with status badges, invoice download, and download links (as specified in PRD v1 extended here with bundle orders)
	Downloads
	/account/downloads
	All downloadable products ever purchased, with download count meter, re-download button (if limit not reached), link-expired indicator
	Wishlist
	/account/wishlist
	Grid of wishlisted products + bundles. Remove button. 'Buy Now' CTA. 'Price dropped' badge if price reduced since wishlisting.
	Reviews
	/account/reviews
	Reviews left by customer. Edit (within 30 days) or delete own reviews. Prompt: 'You haven't reviewed [product] yet' for purchases without a review.
	Notifications
	/account/preferences#notifications
	Notification preference toggles (see Screen 14)
	Affiliate
	/account/affiliate
	If not affiliate: application form. If pending: 'Under review' status. If active: mini-dashboard with referral link, earnings, conversions, payout status.
	Security
	/account/security
	Active sessions list, revoke sessions, 2FA setup (TOTP), API token management if developer access enabled
	

5.9 Screen 16 — Search Results Page
Route: /search?q=...  |  Access: Public
Layout & Zones
Zone
	Content & Interaction
	Search Bar (top)
	Pre-populated with current query. Autocomplete dropdown on typing (calls GET /search/suggestions). Clear button.
	Filter Sidebar (left 22%)
	Product type checkboxes | Price range slider (min–max from query results) | Tags facet (top 20 tags, with count) | Rating filter | Sort: Relevance (default) | Newest | Best Selling | Price ↑/↓
	Results Count & Sort Bar
	'X results for \"query\"' | Sort dropdown | Grid/List view toggle
	Results Grid (right 78%)
	Same product card component as marketplace. If zero results: 'No results for [query]' with: suggested similar searches, top-selling products section, 'Browse all products' CTA.
	Did You Mean?
	If query appears misspelled (Elasticsearch suggest), show 'Did you mean: [corrected]?' above results
	Trending Searches (zero-result page)
	If no results, show: 'Popular right now' section with top 6 trending search terms as clickable chips
	Bundle Results Section
	If bundles match the query, shown in a separate horizontal scroll row above individual product results with 'Bundle — Save X%' badge
	

5.10 Screen 17 — System Health Monitor
Route: /admin/system  |  Access: Super Admin
Purpose
A real-time operational cockpit showing the health of every system component — not business metrics (that's the Dashboard) but infrastructure and service health metrics for the technical team.
Layout & Zones
Zone
	Content & Interaction
	Service Status Row
	Status pill (green/yellow/red) for each: API Server | PostgreSQL | MongoDB | Redis | Elasticsearch | S3 | Bull Queue | Stripe | LLM API | Email Server
	API Response Time Chart
	Real-time line chart: p50, p95, p99 latencies over past 60 minutes. Auto-refresh every 30s.
	Queue Health Panel
	Per-queue table: Queue Name | Waiting | Active | Completed (1h) | Failed (1h) | Delayed. Click a queue → drills into Bull Board for that queue.
	Error Rate Monitor
	Grouped bar chart: HTTP 4xx vs 5xx errors per 5-minute bucket over past 2 hours. Red threshold line at configured SLA.
	Database Connections
	Active connections vs max pool size for PG. MongoDB atlas cluster health link. Slow query count (queries > 500ms in past hour).
	LLM API Health
	Per-provider latency trend, error rate, estimated remaining quota, cost burned today vs budget.
	Recent Alerts
	Chronological list of triggered alerts in past 24 hours with severity, resolved status, and link to incident.
	Uptime History
	90-day uptime calendar (green/yellow/red days). Click a day → shows incidents that day.
	

5.11 Screen 18 — Audit Log Viewer
Route: /admin/audit-logs  |  Access: Super Admin
Layout & Zones
Zone
	Content & Interaction
	Filter Bar
	Date range | Actor (user search) | Action (dropdown of all action types) | Entity type | Entity ID search
	Audit Log Table
	Timestamp | Actor (name + role badge) | Action | Entity type + ID | IP Address | 'View Diff' button
	Diff Viewer Modal
	Opens on 'View Diff': side-by-side JSON comparison of old_value and new_value with changed fields highlighted in yellow
	Export Button
	CSV export of filtered results (up to 100,000 rows via background job with email notification on completion)
	Retention Notice
	Banner: 'Audit logs retained for 365 days. Records older than 365 days are automatically purged.'
	

5.12 Screen 19 — Automation Intelligence Dashboard
Route: /admin/automation  |  Access: Admin, Super Admin
Purpose
A dedicated view for monitoring all twelve automation systems defined in Section 2 — separate from the main Dashboard which shows business metrics, and separate from System Health which shows infrastructure. This screen is specifically about the intelligence pipeline health.
Layout & Zones
Zone
	Content & Interaction
	Automation Systems Status Grid
	12 cards — one per automation system. Each shows: system name, status (active/paused/error), last run time, items processed last 24h, and 'Configure' link.
	Auto-Approval Performance Panel
	Precision / Recall / F1 gauge charts. Confusion matrix table. 'Items auto-approved today' count. 'Items spot-checked' count. Model version + last trained date. 'Retrain Now' button.
	Trend Engine Live Feed
	Real-time ticker of incoming trend signals. Current hot topics ranked. Next batch generation plan based on trends. Override panel (manual topic injection).
	Deduplication Stats
	Duplicate rejection rate (past 30 days) | Average similarity score of rejected items | Top categories with highest duplication | Vector index size.
	Repurposing Engine Output
	Items repurposed today | Source breakdown (script→social, prompt→poster, etc.) | Acceptance rate of repurposed items by reviewers.
	Feedback Loop Matrix
	Heatmap of current category weights (same as Trend Dashboard but here updated more frequently — per-batch not per-trend-refresh).
	Queue Overview
	Condensed version of queue health (full version in System Health).
	

5.13 Screen 20 — Affiliate Portal (Customer-Facing)
Route: /affiliates (public landing) and /account/affiliate (dashboard for active affiliates)
Public Landing Page (/affiliates)
Zone
	Content
	Hero
	Headline: 'Earn 20% Commission on Every Sale'. Subheadline with key benefits. 'Apply Now' CTA.
	How It Works
	3-step visual: 1. Apply → 2. Share your link → 3. Earn commissions. Animated icons.
	Commission Structure
	Table: Standard (20%), Silver tier $500+ earned (25%), Gold tier $2000+ earned (35%).
	FAQ Accordion
	Common questions: When do I get paid? What's the cookie duration? Can I promote on social media? etc.
	Social Proof
	'Join X affiliates who earned $Y last month' social proof bar.
	Active Affiliate Dashboard (/account/affiliate)
Zone
	Content
	Earnings Summary
	Pending Balance | Total Earned | Current Tier | Next Tier Progress bar
	Referral Link Panel
	Unique referral URL + copy button. QR code download. Social share buttons (Twitter, Facebook, LinkedIn, WhatsApp).
	Conversions Table
	Order date | Customer (masked: j***@gmail.com) | Order value | Commission earned | Status (pending/approved/paid)
	Payout History
	Previous payouts with date, amount, method, and status.
	Payout Request Button
	Active if pending balance ≥ $20; shows next payout date if on scheduled cycle.
	Marketing Materials
	Downloadable banners, product images approved for affiliate use, pre-written social captions.
	________________


6. Extended Commerce Features


6.1 Multi-Currency Support
The platform will display prices in the customer's detected local currency while all transactions settle in USD. Currency detection uses the Geolocation API (browser) or IP-based lookup as a fallback.
Supported Currencies (Phase 2)
	Display Format
	Conversion Method
	USD (base)
	$0.00
	1:1 (base currency)
	EUR
	€0,00
	Live rate via Open Exchange Rates API, refreshed every 6 hours
	GBP
	£0.00
	Same
	INR
	₹0,000
	Same
	CAD
	CA$0.00
	Same
	AUD
	A$0.00
	Same
	Stripe handles charge currency conversion automatically. All stored prices, revenue, and commission figures are in USD. Display conversion is frontend-only and clearly labelled as approximate.


6.2 Tax Calculation (Stripe Tax)
PRD v1 did not specify tax handling. This is a legal requirement for selling digital goods in many jurisdictions. Stripe Tax is used to automatically calculate and collect the correct sales tax / VAT / GST based on the customer's billing address.
* Stripe Tax is enabled on the Payment Intent creation call via automatic_tax: { enabled: true }.
* Tax-inclusive pricing display for EU customers (VAT included in shown price with 'incl. VAT' label).
* Tax amounts are stored on the order record and displayed on invoices.
* Admin tax reports available in Analytics screen: tax collected by jurisdiction, by period.
* Customers in tax-exempt jurisdictions can submit a tax exemption certificate via support; admin can flag their account as tax_exempt in the users table.


6.3 Licensing System
Every product sale grants the customer a license. Three license tiers are available, each product can be assigned one license type at creation time.
License Tier
	Price Multiplier
	Usage Rights
	Personal License (default)
	1x (base price)
	Use in personal projects. No commercial use. Cannot resell or redistribute.
	Commercial License
	2.5x base price
	Use in client work, YouTube channels, commercial social accounts. Cannot resell the content itself.
	Extended / Developer License
	5x base price
	All commercial rights PLUS ability to use in products sold to multiple end-users (e.g. Canva template packs, SaaS products). Cannot claim authorship of the original content.
	License type is embedded in the product ZIP's README.txt and the PDF footer. The LicenseService generates a unique license certificate (PDF) for each order with: order number, product name, license tier, licensed-to name, issue date, and a verification QR code linking to /verify-license/:code.


6.4 Refund & Dispute Workflow
PRD v1 mentioned refund as a single admin action. This section specifies the complete refund workflow including customer-initiated requests, admin review, and Stripe coordination.
Refund Flow
8. Customer submits refund request via /account/orders/:id → 'Request Refund' button (available within 14 days of purchase).
9. Request form: required reason selection (didn't meet expectations / technical issue / accidental purchase / other) + optional note (max 500 chars).
10. Admin sees refund request in Orders screen with 'Refund Requested' status badge and customer's reason.
11. Admin actions: Approve Refund (triggers Stripe refund via POST /orders/:id/refund) or Deny with reason.
12. If approved: Stripe refund processed; order status → 'refunded'; download links invalidated; affiliate commission reversed; customer notified via email.
13. Auto-approve refunds for orders < $5 if requested within 24 hours (configurable).
14. If customer disputes via Stripe (chargeback): webhook dispute.created fires; order flagged in admin dashboard; admin receives alert with 72-hour response window.


6.5 Cart & Checkout Enhancements
PRD v1 implemented direct buy-now checkout. This section adds a persistent cart that enables multi-product purchases and coupon application.
* Cart state stored server-side in Redis (TTL: 7 days) keyed by session or user ID.
* API: POST /cart/items (add product or bundle), DELETE /cart/items/:id, GET /cart (full cart with calculated totals), POST /cart/coupon (apply coupon code, returns discount preview), DELETE /cart/coupon (remove applied coupon).
* Cart merges on login: guest cart items are merged with any existing user cart.
* Checkout summary shows: item subtotal, coupon discount (if applied), tax (Stripe Tax estimate), and grand total.
* Abandoned cart detection: if a logged-in user has cart items and does not check out within 1 hour, the automated email trigger fires (Section 2.9).


6.6 Loyalty Points System
A simple points programme rewards repeat customers and encourages larger purchases.
Action
	Points Earned
	Notes
	Purchase $1 of products
	10 points
	Rounded to nearest dollar
	Leave a verified review
	50 points
	Once per product
	Share a product on social (tracked link)
	20 points
	Via unique share URL
	Refer a friend (not affiliate)
	100 points per new registrant
	Separate from affiliate programme
	Account birthday month
	200 bonus points
	On anniversary of account creation
	Points Redemption
	Value
	Minimum Redemption
	Discount on order
	100 points = $1 off
	500 points minimum
	Free product unlock (points-only purchase)
	Product-specific points price set by admin
	Admin configures per product
	Points balance displayed in customer account header. Points are credited 30 days after purchase (after refund window closes). Points expire after 12 months of account inactivity.


6.7 A/B Testing for Product Listings
Admins can run controlled experiments on product listing pages to optimise conversion rate. Two variants of a product listing (A and B) are shown to split user cohorts, with statistical analysis determining the winner.
* Testable variables: thumbnail image, title wording, short description, price point, CTA button text, and featured badge visibility.
* Traffic split: configurable (default 50/50). Split determined by user session hash (deterministic — same user always sees same variant).
* Metrics tracked: view-to-wishlist rate, view-to-purchase rate, average session time on page.
* Statistical significance calculated with Chi-square test; winner declared when p < 0.05 AND minimum 200 conversions per variant.
* Admin UI: /admin/experiments — list of active tests with real-time conversion bars, 'Declare Winner' button, and traffic reallocation (100% to winner).


6.8 Social Sharing & Viral Loop
* Each product detail page has share buttons: Twitter/X, Facebook, LinkedIn, WhatsApp, Copy Link.
* Share links are tracked via /s/:shortCode redirect that logs the click source before redirecting to product page — feeds into analytics.
* Customers can generate a unique share link (/account/orders/:id/share-product/:productId) that credits them loyalty points if someone purchases via that link.
* 'Share your purchase' prompt on order success page: 'Love this pack? Share it and earn 20 points for every new customer who buys.' 
* Social proof widget on product pages: 'X people bought this in the last 24 hours' (real-time counter from Redis).
________________


7. Search & Discovery System
PRD v1 did not specify a search implementation. This section defines the complete search architecture using Elasticsearch to power both the marketplace search and internal content library search.


7.1 Elasticsearch Index Design
Index: products
{
  id:                 keyword,
  title:              text (analyzer: english) + keyword (for sorting),
  short_description:  text (analyzer: english),
  description:        text (analyzer: english, boost: 0.5),
  product_type:       keyword,
  tags:               keyword (array),
  category:           keyword,
  price:              double,
  item_count:         integer,
  purchase_count:     integer,
  avg_rating:         float,
  review_count:       integer,
  status:             keyword,
  created_at:         date,
  updated_at:         date
}


Query Strategy
Query Type
	Elasticsearch Query
	Use Case
	Full-text search
	multi_match on title (^3), tags (^2), description (^1)
	Main search bar
	Autocomplete
	search_as_you_type on title field
	Dropdown suggestions
	Faceted filter
	terms aggregation on product_type, tags
	Filter sidebar counts
	Price range
	range filter on price field
	Price slider
	Semantic/contextual
	kNN search using dense_vector from OpenAI embeddings
	Phase 3 — future
	Spell correction
	suggest (phrase suggester) on title field
	'Did you mean?' feature
	Trending boost
	function_score: purchase_count field value factor, weight 1.5
	Sort by relevance + popularity
	

7.2 Index Synchronisation
* Product published: Elasticsearch document created via webhook from products service (Bull job: seo-generation queue also indexes at same time).
* Product updated: Partial update via PUT /products/:id in ES index.
* Product archived: Document updated with status='archived'; filtered from search results by default query filter.
* Full re-index: POST /search/reindex triggers a background job that reads all published products from PostgreSQL and batch-upserts into ES. Used for recovery or mapping changes.
* Index alias pattern: Write to products_v2 index, alias products points to it. Zero-downtime re-indexing by building products_v3 in background then swapping alias.


7.3 Search Analytics Pipeline
Every search query is logged to MongoDB search_analytics collection (Section 3.2.2). The SearchAnalyticsService aggregates these daily to produce: zero-result query rate, top queries without clicks (opportunity gaps for content generation), conversion rate by query, and query volume trends. These metrics feed into the Trend Intelligence Engine as an internal data source (Section 2.2).
________________


8. Notification & Communication System


8.1 Notification Channels
Channel
	Technology
	Delivery Mechanism
	In-app notifications
	PostgreSQL notifications table + Redis Pub/Sub
	On page load + WebSocket push for real-time
	Email
	Nodemailer + MJML templates
	Bull email queue, throttled 10 concurrent
	Browser Push
	Web Push API (VAPID keys)
	Service Worker registration on first login; opt-in prompt
	Slack (admin only)
	Slack Incoming Webhooks
	Critical system alerts, new order notifications, review queue high-water mark
	

8.2 Email Template System
All emails are built with MJML (a responsive email markup language that compiles to cross-client HTML). Templates are stored as .mjml files in the codebase and rendered server-side before sending. Each template accepts a typed context object.
Template Name
	Trigger
	Key Variables
	welcome
	User registers
	user.full_name, coupon.code, coupon.value
	email_verification
	Registration + resend
	user.full_name, verification_url
	password_reset
	Forgot password flow
	user.full_name, reset_url, expiry_time
	order_confirmation
	Order paid webhook
	order.order_number, items[], download_urls[], total
	download_warning
	4th download attempt
	product.title, downloads_remaining, repurchase_url
	product_announcement
	New product published (matched)
	products[] (up to 3), user.first_name
	price_drop_alert
	Wishlisted product price drops
	product.title, old_price, new_price, product_url
	cart_abandonment_1h
	1h after cart abandoned
	user.first_name, cart_items[], checkout_url
	cart_abandonment_24h
	24h after cart abandoned
	Same + optional discount teaser
	review_request
	7 days post-purchase
	product.title, review_url
	affiliate_daily_summary
	Daily at 08:00 UTC
	earnings_today, pending_balance, top_product
	payout_processed
	Admin marks payout paid
	amount, method, transaction_reference
	refund_approved
	Admin approves refund
	order.order_number, amount, expected_date
	reviewer_nudge
	48h of inactivity with queue
	pending_count, queue_url
	

8.3 Real-Time Notification Delivery
In-app notifications are delivered in real-time to connected browser clients using Server-Sent Events (SSE) via a dedicated endpoint GET /notifications/stream. SSE is preferred over WebSocket for this use case because notifications are unidirectional (server → client) and SSE works through standard HTTP, passing through most corporate proxies without configuration. The client auto-reconnects on disconnect. When the SSE stream is unavailable (mobile background, browser tab hidden), notifications are queued in the database and delivered on next page load.
________________


9. Customer Community Features


9.1 Product Reviews & Ratings
Detailed specification for the reviews system referenced in Sections 3 and 4.
Review Eligibility Rules
* Customer must have a paid order containing the product.
* Only one review per customer per product (enforced by unique DB constraint).
* Reviews can be edited within 30 days of submission.
* Admin can hide or feature any review; cannot edit review content (must remain authentic).
Rating Aggregation
Product average rating and review count are stored as denormalised columns on the products table (avg_rating DECIMAL(3,2) and review_count INTEGER) and updated via a database trigger on INSERT/UPDATE/DELETE of product_reviews. Elasticsearch document is also updated via Bull job on rating change. This avoids expensive aggregate queries on every product page load.
Moderation
* All reviews are published immediately (not held for approval) but flagging by other users puts them in /admin/reviews/flagged queue.
* Reviewer sees flagged reviews within 48 hours and decides: keep, hide, or delete.
* Repeat flaggers (same user flags more than 10 reviews per month) are automatically soft-rate-limited on flagging.


9.2 User-Generated Content Submissions
Customers who have purchased a product can optionally submit showcase content — an example image they generated using a purchased prompt, or a screenshot of a video thumbnail they made using a purchased script. These submissions appear in a 'Community Showcase' section on the product detail page.
* Submission fields: image upload (max 5 MB, image/jpeg or image/png) + optional caption (max 280 chars).
* All submissions are held for admin review before display.
* Admin review queue at /admin/showcase with approve/reject actions.
* Approved showcase images attributed as 'Uploaded by a verified customer'.
* This provides social proof and demonstrates what the purchased content can produce.


9.3 Content Request / Voting Board
A lightweight public feature request board where customers can suggest new content categories, themes, or product types, and upvote existing suggestions. Admins use this as a demand signal for generation direction.
* Route: /community/requests (public, read-only for guests; post/vote requires login).
* Customers can submit: title (required), description (optional), content type preference.
* Upvote system: one vote per user per request. Vote count visible.
* Admin sees the board sorted by votes in /admin/community. Can mark requests as: Planned, In Progress, Completed, Declined.
* Completed requests automatically notify all users who voted with a link to the new product.
* Top 5 voted open requests are also fed as signals into the Trend Intelligence Engine (Section 2.2) as an 'internal' source.


9.4 Verified Customer Badge
Customers who have made 3+ purchases receive a 'Verified Customer' badge on their reviews. Customers with 10+ purchases receive a 'Top Buyer' badge. These badges are computed nightly and stored on the users table as a badges JSONB column. They display on the customer's review cards and, optionally, on their affiliate profile.
________________


10. Affiliate & Referral Programme


10.1 Attribution & Cookie Tracking
When a visitor arrives via an affiliate link (/ref/:code or ?ref=CODE query parameter), the referral code is stored in a first-party cookie (name: aicf_ref, duration: 30 days, SameSite=Lax). The cookie persists across sessions. When the visitor completes a purchase, the ReferralService reads the cookie and creates an affiliate_conversions record linking the order to the affiliate.
Attribution Rules
* Last-click attribution: if a user arrives via multiple affiliate links, the most recent click overwrites the cookie.
* Direct purchase overrides: if a customer who already has an account (and was acquired directly) uses an affiliate link, the affiliate gets credit only if they haven't purchased in the last 90 days.
* Self-referral prevention: affiliates cannot earn commissions on their own purchases (detected by matching user_id of purchaser with affiliate user_id).
* Cookie duration is admin-configurable (default 30 days).


10.2 Commission Tiers & Payout Rules
Tier
	Threshold (lifetime earned)
	Commission Rate
	Standard
	$0 – $499
	20%
	Silver
	$500 – $1,999
	25%
	Gold
	$2,000 – $9,999
	30%
	Platinum
	$10,000+
	35%
	Payout Rules
* Commissions are held in 'pending' status for 30 days (refund window). After 30 days, they are approved automatically unless the associated order was refunded.
* If an order is refunded after commission was approved, the commission is reversed and deducted from pending balance.
* Payouts are processed on the 1st and 15th of each month for all affiliates with approved balance ≥ $20.
* Affiliates choose payout method on their profile: PayPal (instant) or Bank Transfer (3–5 business days).
* Admin can force an off-cycle payout for any affiliate.


10.3 Fraud Prevention
* IP-based detection: if more than 3 conversions come from the same IP within 24 hours via the same affiliate link, they are flagged for admin review.
* Device fingerprinting: unusual patterns (same device, many accounts, multiple purchases via one affiliate) trigger automatic suspension pending review.
* Velocity limits: affiliates cannot accumulate more than $500 in pending commissions per 24-hour period without admin approval.
* All affiliate accounts require email verification before activation.
________________


11. External Integration & Webhook System


11.1 Outbound Webhook Events
The webhook system allows third-party tools (Zapier, Make, n8n, custom integrations) to subscribe to platform events and receive real-time HTTP POST notifications. Every event payload is signed with HMAC-SHA256 using the webhook's secret, enabling receivers to verify authenticity.
Event Type
	Triggered When
	Key Payload Fields
	product.published
	Product status changes to published
	id, title, type, price, url
	product.archived
	Product archived
	id, title, archived_at
	order.paid
	Order payment confirmed
	order_id, customer_email, total, items[]
	order.refunded
	Refund processed
	order_id, amount_refunded, reason
	content.batch_completed
	Generation batch finishes
	batch_id, type, count, status
	review.submitted
	Customer submits product review
	product_id, rating, title
	affiliate.conversion
	Affiliate earns a commission
	affiliate_code, order_total, commission
	user.registered
	New user account created
	user_id, email, role
	coupon.redeemed
	Coupon code used on order
	coupon_code, discount_amount, order_id
	automation.alert
	Any automation system detects an anomaly
	system, severity, message
	

11.2 Webhook Delivery Mechanics
* Delivered via the webhook-dispatch Bull queue (Section 2.11) with 5 retry attempts using exponential backoff (1s, 5s, 25s, 125s, 625s).
* Request headers include: X-AICF-Event (event type), X-AICF-Delivery (unique delivery UUID), X-AICF-Signature-256 (HMAC signature), Content-Type: application/json.
* If all 5 retries fail, webhook is marked with failure_count++. After 50 consecutive failures, webhook is automatically deactivated and admin is alerted.
* Receiver must respond with HTTP 2xx within 30 seconds; otherwise the delivery is retried.
* Each delivery is logged in a webhook_deliveries table (delivery_id, webhook_id, event, status_code, response_body, attempt_number, delivered_at).


11.3 Developer API Access
Admins can generate read-only API tokens for external developers to query platform data — useful for building custom dashboards, Zapier Zaps, or integrating product listings into external websites.
Endpoint (Developer-accessible)
	Data Returned
	Rate Limit
	GET /api/v1/public/products
	Published products (paginated)
	60 req/min
	GET /api/v1/public/products/:id
	Single product detail
	60 req/min
	GET /api/v1/public/bundles
	Published bundles
	60 req/min
	GET /api/v1/public/categories
	Content categories + product counts
	30 req/min
	GET /api/v1/developer/orders
	Orders belonging to the API key owner
	30 req/min
	Developer API tokens are scoped (read:products, read:orders), long-lived (1 year), stored hashed, and revocable from the Settings screen. All developer API calls are logged in audit_logs.
________________


12. Content Intelligence & Versioning


12.1 Content Version History
Every edit to a content item — whether by a reviewer before approving, by the auto-regeneration system, or by an admin — creates a new version record in the content_versions MongoDB collection (Section 3.2.1). The version history is accessible from the Content Library screen (Section 5.3) via the item drawer's 'Version History' panel.
* Version number increments on each edit (v1 = original generation, v2 = first edit, etc.).
* Diff between any two versions is computed and displayed as a character-level diff (additions in green, deletions in red).
* Any previous version can be restored with one click; restoration creates a new version (not overwrites), preserving full history.
* Version history is retained indefinitely for approved content, and for 90 days for rejected content before purge.


12.2 Content Performance Attribution
The system tracks which specific content items — not just product packs — drove revenue. When a product pack is purchased, all content_ids in that product's content_ids array receive an attribution credit in a content_performance MongoDB collection. This data powers the Feedback Loop (Section 2.5) and helps reviewers understand which of their approved items are performing commercially.
// content_performance collection (MongoDB)
{
  _id:              ObjectId,
  content_id:       String,
  content_type:     String,
  product_id:       String,       // UUID from PG products
  orders_count:     Number,       // times this content's product was purchased
  revenue_usd:      Number,       // proportional share of product revenue
  last_updated:     Date
}


12.3 Content Quality Score Evolution Tracking
As the quality scoring model improves over time (Section 2.12), the score an item would receive today may differ from the score it received when generated. The system re-evaluates a random 5% sample of all approved content monthly with the latest scoring model, stores the new score alongside the original, and uses the delta to identify systematic scoring drift. Items that would now score below threshold are flagged for optional re-review — the system does not retroactively reject already-approved content, but makes the information available to admins.
________________


13. Operations & Compliance


13.1 GDPR Compliance
Requirement
	Implementation
	Right to Access (Article 15)
	GET /account/gdpr/export — generates a JSON + PDF report of all personal data within 72 hours; download link emailed.
	Right to Erasure (Article 17)
	DELETE /account/gdpr/delete — soft-deletes user account; anonymises PII in orders (email → deleted_user_[uuid]@anon.aicf); purges from MongoDB; removes from Elasticsearch. 30-day cooling-off period before physical deletion.
	Data Portability (Article 20)
	Same export as right to access, in machine-readable JSON.
	Consent Management
	Cookie consent banner on all public pages. Consent stored in cookies table. Granular: strictly necessary / functional / analytics / marketing.
	Data Processor Agreements
	DPAs in place with: OpenAI, Anthropic, AWS, Stripe, MongoDB Atlas, Elasticsearch Cloud.
	Breach Notification
	Security incidents are logged. If breach affects personal data, super admin is alerted within 1 hour; 72-hour notification window to relevant DPA tracked.
	

13.2 Content Moderation & Safety
* All AI-generated content passes through a content safety check using the LLM provider's moderation API (OpenAI Moderation API or equivalent) before being saved to MongoDB.
* Content flagged by the moderation API is automatically rejected with status='safety_rejected' and logged separately in a safety_rejections collection for admin review.
* Categories checked: hate speech, harassment, self-harm, sexual content, violence, dangerous content.
* Admin can configure category-specific thresholds (some categories like 'violence' may need to be more or less strict depending on the content niche — e.g. a gaming prompt pack may include combat themes).
* Human-submitted content (reviews, showcase images, community requests) also passes through the moderation API before display.


13.3 Two-Factor Authentication (2FA)
All admin and reviewer accounts are required to enable TOTP-based 2FA (Google Authenticator, Authy compatible). Customers are encouraged but not required.
* 2FA setup at /account/security: displays QR code (generated by otplib library), ask user to scan and verify with a code, then store encrypted TOTP secret in users table.
* On login: after valid email/password, if 2FA is enabled, return a 2fa_required response with a short-lived (5-minute) intermediate token. Client redirects to /auth/2fa. User submits TOTP code. If valid, normal access token issued.
* Backup codes: 8 single-use backup codes generated at 2FA setup, stored as bcrypt hashes, shown to user once.
* Admin can force-reset 2FA for any user (creates an audit log entry).


13.4 Platform Cost Management
LLM generation is the primary variable cost. The following controls prevent runaway spend.
Control
	Implementation
	Daily LLM spend cap
	Admin-configured in Settings ($). If daily spend (tracked via generation_logs.estimated_cost_usd sum) approaches cap, automation is paused and admin alerted.
	Per-batch token budget
	Each generation job has a max token limit. Jobs exceeding limit are truncated and logged.
	Model fallback
	If primary model (GPT-4o) fails or is quota-limited, system falls back to secondary model (Claude Haiku or GPT-3.5-turbo) automatically, logged with flag.
	Cost dashboard in Settings
	Rolling 30-day cost chart by model and content type. Projected monthly cost based on current rate. Alert threshold configuration.
	Embedding cost control
	Embeddings only computed for content that passes initial quality scoring (≥ threshold). Low-quality items are not embedded, saving cost.
	

13.5 Backup & Disaster Recovery
Asset
	Backup Method
	Frequency
	Retention
	PostgreSQL (RDS)
	Automated RDS snapshots + point-in-time recovery
	Every 5 minutes (PITR)
	35 days
	MongoDB (Atlas)
	Continuous cloud backup + snapshots
	Hourly snapshots
	7 days snapshots, continuous PITR
	Redis
	Redis AOF persistence + ElastiCache backup
	Daily
	7 days
	S3 product files
	S3 Versioning + Cross-Region Replication (CRR)
	Continuous
	90 days versions
	Elasticsearch
	Automated snapshots to S3
	Daily
	14 days
	Code
	GitHub (multi-region replication)
	On every push
	Indefinite
	Disaster recovery runbooks are stored in the engineering wiki and reviewed quarterly. RTO target: 1 hour. RPO target: 5 minutes for transactional data (PostgreSQL), 1 hour for content data (MongoDB).
________________


14. Updated Technology Stack (Additions to PRD v1)
Component
	Technology
	Purpose
	Job Queue
	BullMQ + @nestjs/bull
	Async job processing for all heavy operations
	Queue Dashboard
	Bull Board (@bull-board/nestjs)
	Admin UI at /admin/queues
	Search Engine
	Elasticsearch 8.x (via @elastic/elasticsearch)
	Full-text product search, autocomplete, facets
	Vector Search
	pgvector (PostgreSQL extension)
	Semantic deduplication embeddings
	Email Templates
	MJML + Handlebars
	Responsive transactional email HTML
	Real-time Push
	Server-Sent Events (native Node.js)
	In-app notification streaming
	Browser Push
	Web Push API + web-push npm package
	Optional push notifications
	Multi-currency
	Open Exchange Rates API
	Exchange rate data, 6-hour cache in Redis
	Tax Calculation
	Stripe Tax
	Automatic VAT/GST/sales tax on checkout
	2FA
	otplib npm package
	TOTP generation and verification
	A/B Testing
	Custom (session hash splitting, stats via chi-square)
	Product listing experiments
	Fraud Detection
	IP-Rate-Limit (Redis) + custom device fingerprint
	Affiliate fraud prevention
	Content Safety
	OpenAI Moderation API
	Pre-save content safety check
	Analytics Charts
	Apache ECharts (frontend)
	All dashboard charts
	PDF Invoices
	PDFKit (already in v1, extended for invoices and license certs)
	Invoices, license certificates
	________________


15. Phase 2 Implementation Roadmap
The following roadmap extends the 18-week Phase 1 plan from PRD v1. Phase 2 begins immediately after Phase 1's production launch. Teams can begin Phase 2 work on non-conflicting modules during Phase 1 Week 14–18.
Phase
	Duration
	Scope
	Key Deliverables
	P2-1: Queue & Search Foundation
	Weeks 1–2
	BullMQ installation, queue definitions, all Phase 1 jobs migrated to Bull. Elasticsearch setup, products index, basic search endpoint.
	All jobs running through Bull. /search endpoint live.
	P2-2: Smart Automation
	Weeks 3–5
	Smart Auto-Approval Engine, Content Deduplication (pgvector), Trend Intelligence Engine (data sources + scoring)
	Auto-approval active. Duplicate rejection live. Trend feed populated.
	P2-3: Repurposing & Feedback Loop
	Week 6–7
	Content Repurposing Engine, Performance Feedback Loop, Auto-Regeneration on Rejection, Dynamic Pricing Engine (recommendation mode first)
	All four systems live in recommendation/review mode.
	P2-4: Commerce Expansion
	Weeks 8–9
	Coupon system, Cart & checkout enhancements (multi-item), Bundle builder, Wishlists, Multi-currency display, Stripe Tax
	Coupons, bundles, cart all live.
	P2-5: Community & Reviews
	Week 10
	Product reviews, Rating aggregation, Loyalty points, Social sharing, Community request board
	Reviews live. Points system active.
	P2-6: Affiliate Programme
	Weeks 11–12
	Cookie attribution, Commission tracking, Affiliate dashboard, Admin management, Fraud detection
	Affiliate programme open for applications.
	P2-7: Notifications & Email Campaigns
	Weeks 13–14
	All 14 email templates, In-app notification system (SSE), Email campaign triggers, Notification preferences, Push notifications (optional)
	All automated emails live.
	P2-8: New Admin Screens
	Weeks 15–16
	Analytics screen, Trend dashboard, Content library, Automation intelligence dashboard, System health monitor, Audit log viewer, Coupon manager, Bundle builder UI
	All 8 new admin screens live.
	P2-9: Customer Portal & Search UX
	Week 17
	Customer account portal (all sub-pages), Search results page with facets and autocomplete, Affiliate customer portal
	Full customer self-service live.
	P2-10: Integrations & Compliance
	Week 18
	Webhook system, Developer API tokens, GDPR export/delete, 2FA enforcement for admins, Content safety checks, Cost management controls
	Webhooks live. GDPR compliant.
	P2-11: QA, Performance & Launch
	Weeks 19–20
	Load testing (5000 concurrent users), Security penetration test, Elasticsearch query optimisation, Full regression test suite, Staging sign-off
	Phase 2 production launch.
	________________


16. Acceptance Criteria — Phase 2 Features
Feature
	Acceptance Criteria
	Smart Auto-Approval
	After 500+ training samples: system correctly auto-approves items with confidence ≥ 0.94; auto-approved items appear in approved queue without human action; spot-check 10% visible in separate queue; precision ≥ 88% on held-out validation set.
	Deduplication
	Items with cosine similarity > 0.92 to any existing approved item are automatically rejected; rejection reason in log reads 'semantic_duplicate'; no two approved items in the same category have similarity > 0.92.
	Trend Intelligence
	Hot topics list populated within 6 hours of system start; generation batch prompts include trend hints when hot topics exist; trend-to-sales correlation chart shows data in Analytics screen.
	Coupon System
	Valid code applied in checkout reduces order total correctly; expired code returns 422 with 'code expired' message; per-user usage limit enforced; redemption recorded in coupon_redemptions table.
	Product Bundles
	Bundle page shows all included products; bundle price lower than sum of individual prices; purchasing bundle creates single order with all products downloadable; bundle purchase_count increments.
	Search
	Query 'cinematic prompts' returns relevant results in < 200ms; autocomplete responds in < 100ms with 8 suggestions; facet counts match actual filtered result counts; zero-result page shows trending searches.
	Affiliate Attribution
	Affiliate link visit sets cookie; subsequent purchase on same browser credits correct affiliate; self-referral prevented; commission record created in pending status; admin payout triggers Stripe payout or marks as processed.
	Wishlist
	Product added to wishlist persists across sessions; wishlisted product price drop triggers email notification to user; 'Buy Now' from wishlist proceeds to checkout.
	Reviews
	Only users with paid orders for the product can submit review; average rating on product updates within 60s of new review; admin can hide review; customer cannot review own product.
	Notifications
	Order confirmation email received within 60s of payment; in-app notification appears in real-time (SSE, < 5s); preference toggle immediately stops that channel for that type.
	GDPR Export
	Export request produces downloadable JSON file within 72h containing: orders, downloads, reviews, profile data; no data from other users included.
	Webhooks
	Registered webhook receives order.paid event within 10s of payment; payload signature verifiable with shared secret; failed delivery retried 5 times with exponential backoff.
	2FA
	Admin cannot access protected routes without completing 2FA; TOTP code accepted within ±30s window; backup code invalidated after use.
	________________


17. Appendix — Additional Environment Variables
Variable
	Description
	Required
	ELASTICSEARCH_URL
	Elasticsearch cluster URL
	Yes (Phase 2)
	ELASTICSEARCH_API_KEY
	Elastic API key
	Yes
	BULL_REDIS_URL
	Redis URL for Bull queues (can be same as REDIS_URL)
	Yes
	VAPID_PUBLIC_KEY
	Web Push VAPID public key
	Optional (push notifications)
	VAPID_PRIVATE_KEY
	Web Push VAPID private key
	Optional
	VAPID_EMAIL
	Contact email for Web Push
	Optional
	OPEN_EXCHANGE_RATES_APP_ID
	API key for currency rates
	Yes (multi-currency)
	STRIPE_TAX_ENABLED
	boolean: 'true' to enable Stripe Tax
	Yes
	OPENAI_MODERATION_ENABLED
	boolean: 'true' to run safety checks
	Yes
	DAILY_LLM_SPEND_CAP_USD
	Daily LLM budget ceiling e.g. '50'
	Yes
	AUTO_APPROVE_CONFIDENCE_THRESHOLD
	Float 0–1, default '0.94'
	Yes
	AUTO_REJECT_CONFIDENCE_THRESHOLD
	Float 0–1, default '0.90'
	Yes
	AFFILIATE_COOKIE_DURATION_DAYS
	Integer, default '30'
	Yes
	AFFILIATE_DEFAULT_COMMISSION_RATE
	Float e.g. '0.20' for 20%
	Yes
	AFFILIATE_MIN_PAYOUT_USD
	Float e.g. '20.00'
	Yes
	TREND_REFRESH_INTERVAL_HOURS
	How often to refresh trend data, default '6'
	Yes
	PGVECTOR_INDEX_LISTS
	ivfflat lists parameter, default '100'
	Yes
	SLACK_ALERT_WEBHOOK_URL
	Slack incoming webhook for system alerts
	Optional
	GOOGLE_TRENDS_API_KEY
	Google Trends API access
	Optional
	TWITTER_BEARER_TOKEN
	Twitter API v2 bearer token for trending topics
	Optional
	YOUTUBE_DATA_API_KEY
	YouTube Data API v3 key for trending videos
	Optional
	TOTP_ISSUER_NAME
	App name in authenticator apps e.g. 'AI Content Factory'
	Yes
	LICENSE_CERT_BASE_URL
	Base URL for license verification QR e.g. https://aicf.io/verify-license'
	Yes
	CART_SESSION_TTL_DAYS
	Cart expiry in days, default '7'
	Yes
	LOYALTY_POINTS_PER_DOLLAR
	Points earned per $1 spent, default '10'
	Yes
	POINTS_EXPIRY_MONTHS
	Months of inactivity before points expire, default '12'
	Yes
	

© 2026 AI Content Factory  —  Phase 2 PRD Supplement  —  v2.0.0  —  CONFIDENTIAL