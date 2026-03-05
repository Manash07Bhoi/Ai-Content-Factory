# Architecture Specification - AI Content Factory

This document summarizes the architectural design decisions and component interactions for the AI Content Factory based on the PRD.

## System Architecture

The AI Content Factory backend is designed as a single **NestJS monolith**, deliberately avoiding microservices for Phase 1 and 2 to reduce operational complexity. The architecture is modularly separated by domain concern.

### Key Characteristics:
*   **Runtime:** Node.js (>= 20 LTS)
*   **Language:** TypeScript (strict mode enabled)
*   **Framework:** NestJS (modular architecture)
*   **Data Layer Separation:**
    *   **PostgreSQL (TypeORM):** Owns all business state (Users, Orders, Payments, Products, Approvals, Coupons, Affiliates). Uses `pgvector` for deduplication embeddings.
    *   **MongoDB (Mongoose):** Owns all LLM-generated content (Prompts, Scripts, Posters, Social Posts, Logs, Trend Signals).
*   **Cache & Queues:** Redis serves both application caching (e.g., stats) and job queues via BullMQ.
*   **Search:** Elasticsearch for fast, faceted product search and internal content discovery.
*   **Storage:** AWS S3 for private/public file storage (ZIPs, PDFs, images). Cloudinary optionally for image CDN.

### The Core Generation Loop

1.  **Scheduler:** Cron jobs trigger the `LLMClientService` to call OpenAI/Anthropic.
2.  **Generation:** Raw content is returned.
3.  **Safety Check:** Content runs through moderation APIs.
4.  **Quality Scoring:** `CategorisationService` scores content (0-100).
5.  **Deduplication:** Embeddings are checked against `pgvector` to reject duplicates.
6.  **Storage:** Content saved to MongoDB (`pending` status).
7.  **Review:** Humans (or Smart Auto-Approval Engine) approve content.
8.  **Packaging:** `ProductBuilder` bundles approved items into PDFs/ZIPs.
9.  **Storage:** Pack uploaded to S3.
10. **Listing:** PostgreSQL `Product` record created and published to the Marketplace.
11. **Sale:** Customer purchases via Stripe, receives pre-signed S3 URL for download.

### Advanced Automation Systems (Phase 2)
*   **Smart Auto-Approval Engine:** Uses logistic regression on past reviews to auto-approve high-confidence content.
*   **Trend Intelligence Engine:** Ingests external signals (Google Trends, Twitter, Reddit) to dictate generation topics.
*   **Content Repurposing Engine:** Converts high-performing content (e.g., Script) into other formats (e.g., Social Posts).
*   **Dynamic Pricing Engine:** Recommends price adjustments based on sales velocity and demand.
*   **Automated SEO Metadata:** Generates SEO tags (title, description, JSON-LD) upon product publish.

## API & Communication

*   **REST API:** Prefix `/api/v1`. Uses standard HTTP methods and status codes.
*   **Authentication:** JWT (Access & Refresh tokens) via Passport.js.
*   **Authorization:** Role-based Access Control (RBAC) via NestJS Guards (`@Roles()`).
*   **Real-time:** Server-Sent Events (SSE) for in-app notifications.
*   **Webhooks:** Stripe webhooks for payment confirmation. Custom outbound webhooks for external integrations.

## Frontend Architecture

*   **Stack:** React with Vite, TypeScript.
*   **State Management:** Chosen appropriately (e.g., Zustand or Redux).
*   **Routing:** React Router.
*   **Surfaces:**
    *   **Admin/Reviewer Surface:** Dashboard, Queue, Generators, Config.
    *   **Customer Surface:** Marketplace, Checkout, Account Portal.
*   **Styling:** Responsive, mobile-first design.
