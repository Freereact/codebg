---
name: codebg_db_schema
description: PostgreSQL schema designed for CodeBG backend expansion — tables, indexes, rationale
type: project
---

Full schema in migration file: `backend/src/db/migrations/0001_initial.sql` (to be created).

**Why:** Schema designed to support auth, project management, payments, and file uploads for the $49+$19/mo business model.

**How to apply:** When writing queries or adding tables, reference this schema to avoid drift. All indexes listed here have rationale — do not drop without checking query patterns.

Tables:
- `users` — id (UUID), email (UNIQUE), name, role ('customer'|'admin'), stripe_customer_id (UNIQUE nullable), created_at, last_login_at
- `magic_link_tokens` — id, user_id (FK), token_hash (SHA-256, UNIQUE), expires_at, used_at, ip, created_at
- `projects` — id, user_id (FK), title, business_name, template_slug, status (enum), notes (admin-only), domain, config_json (JSONB), logo_url, created_at, updated_at, launched_at
- `content_requests` — id, project_id (FK), user_id (FK), description, status ('open'|'in_progress'|'done'), created_at, resolved_at
- `subscriptions` — id, user_id (FK), project_id (FK nullable), stripe_subscription_id (UNIQUE), stripe_price_id, plan, status, current_period_start/end, cancel_at_period_end, created_at, updated_at
- `invoices` — id, user_id (FK), stripe_invoice_id (UNIQUE), stripe_payment_intent_id, amount_cents, currency, status, description, period_start/end, paid_at, created_at
- `uploads` — id, user_id (FK), project_id (FK nullable), spaces_key (UNIQUE), spaces_url, mime_type, size_bytes, purpose ('logo'|'photo'|'document'), created_at
- `email_jobs` — id, type, to_email, status ('pending'|'sent'|'failed'), resend_id, error, attempts, sent_at, created_at
- `stripe_events` — stripe_event_id (PK — idempotency), type, processed_at

Key partial indexes:
- `magic_link_tokens`: WHERE used_at IS NULL (only unused tokens are ever looked up)
- `email_jobs`: WHERE status = 'pending' (retry sweep only scans pending rows)

First admin user: `UPDATE users SET role = 'admin' WHERE email = 'you@codebg.com';` (done via psql after schema applied)
