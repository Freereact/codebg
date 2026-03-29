---
name: codebg_backend_expansion
description: Full backend expansion plan for CodeBG — from single email-job endpoint to auth/projects/payments/admin API
type: project
---

Phase 1 of backend expansion has been fully designed. Plan at `/home/sz-server/projects/codebg/dev_info/backend-expansion-plan.md`.

**Why:** Business model pivot from one-time $49 contact-form-only to $49 setup + $19/mo recurring subscription with client portal, Stripe payments, project management, and admin CRM.

**How to apply:** When implementing any backend route, auth flow, or DB query, refer to the plan for exact file paths, SQL schemas, middleware chain order, and migration phase sequencing.

Key decisions made:
- Remove RabbitMQ + Redis (3-phase migration to avoid downtime)
- `node-postgres` (pg) instead of ORM — raw SQL, transparent queries
- Magic link auth with SHA-256 hashed tokens, 15-min TTL, atomic UPDATE-RETURNING for single-use enforcement
- JWT in httpOnly + Secure + SameSite=Strict cookie (15-day expiry)
- DO Spaces presigned PUT URLs — file bytes never touch API server
- Stripe `mode: subscription` with one-time setup fee + recurring in one checkout
- `stripe_events` table for webhook idempotency (PK on stripe_event_id)
- In-process `express-rate-limit` (acceptable for single container)
- Admin role identified by `users.role = 'admin'` — first admin set via SQL manually

Migration phases:
1. Add Postgres + new routes alongside existing ones (keep RabbitMQ + Redis)
2. Migrate email job tracking from Redis to Postgres `email_jobs` table
3. Remove RabbitMQ + Redis containers, delete worker.ts

Target compose: single `codebg-api` container, external Postgres via private VPC URI.
