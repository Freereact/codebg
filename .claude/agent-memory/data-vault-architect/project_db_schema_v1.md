---
name: Database Schema V1 Deployed
description: Initial Postgres schema designed 2026-03-18 with 8 tables, Drizzle ORM, replacing Redis+RabbitMQ for email jobs
type: project
---

Initial schema designed on 2026-03-18 with 8 tables: users, projects, subscriptions, payments, email_jobs, auth_tokens, content_requests, admin_notes.

**Why:** Greenfield — Postgres was provisioned but empty. Schema designed to support the full platform transition (accounts, payments, pipeline, CRM).

**How to apply:**
- ORM is Drizzle (not Prisma) — schema at `backend/src/db/schema.ts`
- Migration at `backend/migrations/001_initial_schema.sql` with down at `001_initial_schema_down.sql`
- Types inferred via `backend/src/db/types.ts` — use `User`, `Project`, `NewEmailJob`, etc.
- Database is `defaultdb` on DO Managed Postgres (not a separate `codebg` database)
- Connection config: pool max=5, idle 30s, timeout 5s, SSL required
- email_jobs table replaces RabbitMQ queue + Redis hashes using `FOR UPDATE SKIP LOCKED` pattern
- Project status transitions enforced by trigger (lead->paid->brief_received->draft_ready->in_review->revisions->live->maintenance)
- Auth is magic link: tokens stored as SHA-256 hash, 15-min expiry, single-use
