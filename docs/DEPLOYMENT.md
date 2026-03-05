# Deployment Guide - AI Content Factory

This document outlines the deployment strategy, environments, and infrastructure components required to run the AI Content Factory in production.

## Environments

1.  **Development:** Local environment utilizing `docker-compose.yml` to spin up PostgreSQL, MongoDB, Redis, and Elasticsearch alongside the NestJS and React development servers.
2.  **Staging:** Pre-production cloud environment mirroring the production infrastructure at a smaller scale. Used for QA sign-off and E2E testing.
3.  **Production:** The live, auto-scaling, highly available environment.

## Infrastructure Components (Production)

*   **API Servers:** Node.js Docker containers orchestrated via AWS ECS (Elastic Container Service) or Kubernetes. Configured for horizontal auto-scaling (minimum 2 instances).
*   **Relational Database:** AWS RDS for PostgreSQL (Multi-AZ) with automated backups and point-in-time recovery (PITR). Requires the `pgvector` extension enabled.
*   **Document Database:** MongoDB Atlas (M30 cluster or equivalent) configured as a 3-node replica set.
*   **Cache & Message Broker:** AWS ElastiCache for Redis. Used for session management, rate limiting, application caching, and BullMQ job queues.
*   **Search Engine:** Elasticsearch Cluster (e.g., Elastic Cloud or AWS OpenSearch) for product and content search indexing.
*   **Object Storage:** AWS S3.
    *   `Private Bucket`: Product files (PDFs, ZIPs). Accessed only via application-generated pre-signed URLs.
    *   `Public Bucket`: Product thumbnails, preview samples, avatars. Served via CDN.
*   **Content Delivery Network (CDN):** AWS CloudFront or Cloudinary for delivering static assets and images globally.
*   **Load Balancer:** AWS Application Load Balancer (ALB) handling SSL termination and routing traffic to API containers.
*   **Secrets Management:** AWS Secrets Manager for storing sensitive credentials (DB passwords, Stripe keys, API keys). Injected as environment variables at runtime.

## CI/CD Pipeline

The deployment pipeline is automated using **GitHub Actions**.

### Workflow:
1.  **Pull Request:** Triggers automated test suite (Unit and E2E tests). Requires >= 85% branch coverage.
2.  **Merge to Main:**
    *   Builds the Docker image for the backend API.
    *   Tags the image with the commit SHA.
    *   Pushes the image to a container registry (e.g., AWS ECR).
3.  **Staging Deployment:** Auto-triggered upon push to ECR. ECS service updates with the new image.
4.  **Production Promotion:** Requires manual QA sign-off in GitHub Actions to promote the Staging image to Production.
5.  **Production Deployment:** ECS performs a rolling update ensuring zero-downtime (maintaining a minimum of 50% healthy tasks during deployment).
6.  **Database Migrations:** TypeORM migrations run automatically as part of the deployment pipeline, immediately before routing traffic to the new API version.

## Disaster Recovery & Backups

*   **RTO (Recovery Time Objective):** < 1 hour.
*   **RPO (Recovery Point Objective):** < 6 hours.
*   **PostgreSQL:** Automated RDS snapshots every 6 hours + PITR (5-minute granularity). Retention: 35 days.
*   **MongoDB:** Continuous cloud backups via Atlas. Hourly snapshots. Retention: 7 days snapshots + continuous PITR.
*   **Redis:** Daily ElastiCache backups (AOF persistence). Retention: 7 days.
*   **S3:** Versioning enabled. Cross-Region Replication (CRR) configured for critical product files. Retention: 90 days.
*   **Elasticsearch:** Daily automated snapshots to S3. Retention: 14 days.

## Monitoring & Alerting

*   **Logs:** Structured JSON logging (Winston). Shipped to CloudWatch or Datadog. Retention: 90 days.
*   **Metrics:** API latencies, error rates, queue depths, and DB connections monitored via CloudWatch/Datadog.
*   **Alerting:** Critical errors (e.g., HTTP 500s, DB disconnects, Stripe failures, high LLM spend) trigger PagerDuty/Slack notifications to the on-call rotation.