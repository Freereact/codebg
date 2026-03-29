-- ============================================================================
-- CodeBG Initial Schema Migration
-- Version: 001
-- Date: 2026-03-18
-- Engine: PostgreSQL 17 (DigitalOcean Managed, db-s-1vcpu-1gb)
-- ============================================================================
--
-- WARNING: QA REVIEW REQUIRED
-- This migration must be reviewed by senior and product team before deployment.
--
-- Business context:
--   CodeBG is a web development service for small businesses. Customers sign up,
--   pick a template, provide business info, pay (one-time setup + monthly sub),
--   and get a website built. A single operator manages everything via admin panel.
--
-- Design decisions:
--   - UUID v7 primary keys (time-ordered, index-friendly, no enumeration)
--   - TIMESTAMPTZ on all temporal columns (server is in Toronto, clients are local)
--   - TEXT over VARCHAR(n) with CHECK constraints for length limits
--   - Soft delete via deleted_at where business logic requires it (users, projects)
--   - JSONB only for genuinely semi-structured data (template config, business info)
--   - All foreign keys default to ON DELETE RESTRICT unless CASCADE is justified
--   - Enums enforced via CHECK constraints (not PG ENUM types) for easier migration
-- ============================================================================

-- ============================================================================
-- 0. Extensions
-- ============================================================================

-- pgcrypto for gen_random_uuid(); available on DO Managed Postgres
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. updated_at trigger function (shared by all tables)
-- ============================================================================

-- Automatically sets updated_at to NOW() on every UPDATE.
-- Applied to every table that has an updated_at column.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. users
-- ============================================================================
-- Customer accounts. Every paying client gets a row here.
-- Auth is magic-link based (no passwords stored).
-- Business info stored as JSONB because fields vary by industry
-- (a bakery has "hours" and "menu highlights", a dentist has "services" and
-- "insurance accepted"). This is genuinely semi-structured data.

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  email           TEXT NOT NULL,
  name            TEXT NOT NULL,
  phone           TEXT,                -- nullable: not all leads provide phone

  -- Business information (semi-structured, varies by industry)
  -- Example: {"business_name": "Sunset Bakery", "industry": "bakery",
  --           "address": "123 Main St, Penticton", "hours": "Mon-Sat 7am-5pm"}
  business_info   JSONB NOT NULL DEFAULT '{}',

  -- Stripe integration
  stripe_customer_id TEXT,             -- set when Stripe customer is created

  -- Role: 'client' for paying customers, 'lead' for contact-form-only,
  -- 'admin' for the operator. Single admin for now, but the constraint
  -- allows the system to grow.
  role            TEXT NOT NULL DEFAULT 'client',

  -- Soft delete: null means active, timestamp means deleted
  deleted_at      TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT users_email_format
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT users_email_length
    CHECK (char_length(email) <= 320),
  CONSTRAINT users_name_length
    CHECK (char_length(name) BETWEEN 1 AND 200),
  CONSTRAINT users_phone_length
    CHECK (phone IS NULL OR char_length(phone) BETWEEN 7 AND 30),
  CONSTRAINT users_role_valid
    CHECK (role IN ('lead', 'client', 'admin')),
  CONSTRAINT users_stripe_customer_id_prefix
    CHECK (stripe_customer_id IS NULL OR stripe_customer_id LIKE 'cus_%')
);

-- Unique email among non-deleted users. Allows re-registration after soft delete.
CREATE UNIQUE INDEX users_email_active_idx
  ON users (lower(email))
  WHERE deleted_at IS NULL;

-- Stripe webhook lookups: find user by stripe_customer_id
CREATE UNIQUE INDEX users_stripe_customer_id_idx
  ON users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Admin dashboard: list users by role
CREATE INDEX users_role_idx ON users (role)
  WHERE deleted_at IS NULL;

-- Admin dashboard: recently created users
CREATE INDEX users_created_at_idx ON users (created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE users IS 'Customer accounts and leads. Auth is magic-link based.';
COMMENT ON COLUMN users.business_info IS 'Semi-structured business data (name, address, industry, hours). Varies by client type.';
COMMENT ON COLUMN users.role IS 'lead = contact form only, client = paid, admin = operator';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp. NULL = active.';

-- ============================================================================
-- 3. projects
-- ============================================================================
-- A web project for a client. Tracks the full pipeline from payment through
-- launch and ongoing maintenance.
--
-- Pipeline stages:
--   lead -> paid -> brief_received -> draft_ready -> in_review ->
--   revisions -> live -> maintenance -> cancelled
--
-- A user can have multiple projects (e.g., main site + landing page).

CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Template and configuration
  -- template_slug matches the sample-apps directory names: bakery, dental, etc.
  template_slug   TEXT,                -- nullable: custom projects have no template
  -- Site configuration stored as JSONB. This IS the CustomerConfig object
  -- from sample-apps/src/types.ts — hero settings, sections, colors, etc.
  -- Genuinely semi-structured: each template has different section types.
  site_config     JSONB NOT NULL DEFAULT '{}',

  -- Domain and hosting
  domain          TEXT,                -- e.g., "sunsetbakery.com" — set when known
  subdomain       TEXT,                -- e.g., "sunset-bakery" for sunset-bakery.codebg.com staging

  -- Pipeline status
  status          TEXT NOT NULL DEFAULT 'lead',

  -- Pricing
  setup_fee_cents INTEGER,             -- one-time fee in cents (e.g., 4900 = $49.00 CAD)
  plan_tier       TEXT,                -- 'starter', 'professional', 'custom'

  -- Timestamps for pipeline tracking
  paid_at             TIMESTAMPTZ,     -- when initial payment received
  brief_received_at   TIMESTAMPTZ,     -- when client submitted their brief
  draft_ready_at      TIMESTAMPTZ,     -- when first draft was shared
  launched_at         TIMESTAMPTZ,     -- when site went live
  cancelled_at        TIMESTAMPTZ,     -- if project was cancelled

  -- Soft delete
  deleted_at      TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT projects_status_valid
    CHECK (status IN (
      'draft', 'building', 'preview',
      'lead', 'paid', 'brief_received', 'draft_ready',
      'in_review', 'revisions', 'live', 'maintenance', 'cancelled'
    )),
  CONSTRAINT projects_plan_tier_valid
    CHECK (plan_tier IS NULL OR plan_tier IN ('starter', 'professional', 'custom')),
  CONSTRAINT projects_setup_fee_positive
    CHECK (setup_fee_cents IS NULL OR setup_fee_cents >= 0),
  CONSTRAINT projects_domain_length
    CHECK (domain IS NULL OR char_length(domain) BETWEEN 4 AND 253),
  CONSTRAINT projects_subdomain_length
    CHECK (subdomain IS NULL OR char_length(subdomain) BETWEEN 1 AND 63),
  CONSTRAINT projects_template_slug_length
    CHECK (template_slug IS NULL OR char_length(template_slug) BETWEEN 1 AND 100)
);

-- Admin dashboard: list projects by status (the primary CRM view)
CREATE INDEX projects_status_idx ON projects (status)
  WHERE deleted_at IS NULL;

-- Client portal: "my projects"
CREATE INDEX projects_user_id_idx ON projects (user_id)
  WHERE deleted_at IS NULL;

-- Admin: recently updated projects
CREATE INDEX projects_updated_at_idx ON projects (updated_at DESC)
  WHERE deleted_at IS NULL;

-- Unique domain constraint: no two active projects can claim the same domain
CREATE UNIQUE INDEX projects_domain_active_idx
  ON projects (lower(domain))
  WHERE domain IS NOT NULL AND deleted_at IS NULL;

-- Unique subdomain constraint
CREATE UNIQUE INDEX projects_subdomain_active_idx
  ON projects (lower(subdomain))
  WHERE subdomain IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE projects IS 'Web projects. Tracks full pipeline from lead through live/maintenance.';
COMMENT ON COLUMN projects.site_config IS 'CustomerConfig JSON: hero, sections, colors, fonts. Schema varies per template.';
COMMENT ON COLUMN projects.status IS 'Pipeline stage: lead -> paid -> brief_received -> draft_ready -> in_review -> revisions -> live -> maintenance -> cancelled';
COMMENT ON COLUMN projects.setup_fee_cents IS 'One-time setup fee in cents CAD. 4900 = $49.00.';

-- ============================================================================
-- 4. subscriptions
-- ============================================================================
-- Tracks Stripe subscriptions for recurring monthly hosting/maintenance fees.
-- One subscription per project (1:1 relationship, enforced by unique index).
-- Separate from projects because subscription lifecycle (Stripe webhooks)
-- is independent from project pipeline lifecycle.

CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Stripe identifiers
  stripe_subscription_id  TEXT NOT NULL,
  stripe_price_id         TEXT,          -- Stripe price ID for the plan

  -- Subscription state (mirrors Stripe subscription statuses)
  status                  TEXT NOT NULL DEFAULT 'active',

  -- Plan details
  plan_tier               TEXT NOT NULL,  -- 'starter', 'professional', 'custom'
  amount_cents            INTEGER NOT NULL, -- monthly amount in cents CAD

  -- Billing period
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,

  -- Cancellation
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at            TIMESTAMPTZ,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT subscriptions_status_valid
    CHECK (status IN (
      'active', 'past_due', 'unpaid', 'cancelled',
      'incomplete', 'incomplete_expired', 'trialing', 'paused'
    )),
  CONSTRAINT subscriptions_plan_tier_valid
    CHECK (plan_tier IN ('starter', 'professional', 'custom')),
  CONSTRAINT subscriptions_amount_positive
    CHECK (amount_cents > 0),
  CONSTRAINT subscriptions_stripe_sub_id_prefix
    CHECK (stripe_subscription_id LIKE 'sub_%'),
  CONSTRAINT subscriptions_stripe_price_id_prefix
    CHECK (stripe_price_id IS NULL OR stripe_price_id LIKE 'price_%'),
  CONSTRAINT subscriptions_period_order
    CHECK (
      current_period_start IS NULL
      OR current_period_end IS NULL
      OR current_period_end > current_period_start
    )
);

-- Stripe webhook lookups: find subscription by Stripe ID
CREATE UNIQUE INDEX subscriptions_stripe_id_idx
  ON subscriptions (stripe_subscription_id);

-- One active subscription per project
CREATE UNIQUE INDEX subscriptions_project_active_idx
  ON subscriptions (project_id)
  WHERE status NOT IN ('cancelled', 'incomplete_expired');

-- Client portal: "my subscriptions"
CREATE INDEX subscriptions_user_id_idx
  ON subscriptions (user_id);

-- Admin: find past-due subscriptions needing attention
CREATE INDEX subscriptions_status_idx
  ON subscriptions (status)
  WHERE status IN ('past_due', 'unpaid');

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE subscriptions IS 'Stripe subscription tracking. One active subscription per project.';
COMMENT ON COLUMN subscriptions.status IS 'Mirrors Stripe subscription status. Updated via webhooks.';
COMMENT ON COLUMN subscriptions.amount_cents IS 'Monthly recurring amount in cents CAD.';

-- ============================================================================
-- 5. payments
-- ============================================================================
-- Complete payment history: both one-time setup fees and recurring subscription
-- charges. Source of truth is Stripe; this table is our local ledger.
-- Immutable: payments are never updated, only inserted.

CREATE TABLE payments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  project_id              UUID REFERENCES projects(id) ON DELETE RESTRICT,      -- nullable for non-project payments
  subscription_id         UUID REFERENCES subscriptions(id) ON DELETE RESTRICT,  -- nullable for one-time payments

  -- Stripe identifiers
  stripe_payment_intent_id TEXT,
  stripe_invoice_id        TEXT,

  -- Payment details
  amount_cents            INTEGER NOT NULL,
  currency                TEXT NOT NULL DEFAULT 'cad',
  payment_type            TEXT NOT NULL,   -- 'setup_fee' or 'subscription' or 'one_time'
  status                  TEXT NOT NULL DEFAULT 'pending',

  -- Metadata
  description             TEXT,
  stripe_receipt_url      TEXT,

  paid_at                 TIMESTAMPTZ,     -- when payment succeeded (from Stripe)

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- No updated_at: payments are immutable ledger entries

  -- Constraints
  CONSTRAINT payments_amount_nonzero
    CHECK (amount_cents > 0),
  CONSTRAINT payments_currency_valid
    CHECK (currency IN ('cad', 'usd')),
  CONSTRAINT payments_type_valid
    CHECK (payment_type IN ('setup_fee', 'subscription', 'one_time', 'refund')),
  CONSTRAINT payments_status_valid
    CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  CONSTRAINT payments_stripe_pi_prefix
    CHECK (stripe_payment_intent_id IS NULL OR stripe_payment_intent_id LIKE 'pi_%'),
  CONSTRAINT payments_stripe_invoice_prefix
    CHECK (stripe_invoice_id IS NULL OR stripe_invoice_id LIKE 'in_%'),
  CONSTRAINT payments_description_length
    CHECK (description IS NULL OR char_length(description) <= 500)
);

-- Stripe webhook: idempotent payment processing by payment_intent_id
CREATE UNIQUE INDEX payments_stripe_pi_idx
  ON payments (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- Stripe webhook: find payments by invoice
CREATE INDEX payments_stripe_invoice_idx
  ON payments (stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

-- Client portal: "my payment history"
CREATE INDEX payments_user_id_idx
  ON payments (user_id, created_at DESC);

-- Admin: recent payments
CREATE INDEX payments_created_at_idx
  ON payments (created_at DESC);

-- Admin: payments by status (find failed payments)
CREATE INDEX payments_status_idx
  ON payments (status)
  WHERE status IN ('pending', 'failed');

COMMENT ON TABLE payments IS 'Immutable payment ledger. Both one-time and recurring charges.';
COMMENT ON COLUMN payments.amount_cents IS 'Payment amount in cents. Always positive (refunds have type=refund).';
COMMENT ON COLUMN payments.payment_type IS 'setup_fee = one-time project fee, subscription = recurring, one_time = ad-hoc, refund = reversal.';

-- ============================================================================
-- 6. email_jobs
-- ============================================================================
-- Replaces the current Redis hash-based email job tracking.
-- Stores both contact form submissions and system-generated transactional emails.
-- This allows removing Redis and RabbitMQ from the stack: the table IS the queue.
-- Worker polls for status='queued' rows, processes them, updates to 'sent'/'failed'.

CREATE TABLE email_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job type: 'contact_form' for inbound leads, 'transactional' for system emails
  -- (status updates, magic links, receipts)
  job_type        TEXT NOT NULL DEFAULT 'contact_form',

  -- Sender info (for contact form submissions)
  sender_name     TEXT,
  sender_email    TEXT,
  message         TEXT,

  -- For transactional emails
  recipient_email TEXT,                -- who the email is TO
  subject         TEXT,
  body_text       TEXT,                -- plain text body
  body_html       TEXT,                -- HTML body (nullable)

  -- Processing state
  status          TEXT NOT NULL DEFAULT 'queued',
  attempts        INTEGER NOT NULL DEFAULT 0,
  max_attempts    INTEGER NOT NULL DEFAULT 3,
  last_error      TEXT,
  next_retry_at   TIMESTAMPTZ,        -- for retry backoff

  -- Metadata from the original request
  ip_address      TEXT,
  user_agent      TEXT,

  -- Timestamps
  processed_at    TIMESTAMPTZ,         -- when successfully sent
  failed_at       TIMESTAMPTZ,         -- when permanently failed (exhausted retries)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT email_jobs_type_valid
    CHECK (job_type IN ('contact_form', 'transactional', 'magic_link')),
  CONSTRAINT email_jobs_status_valid
    CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'dead')),
  CONSTRAINT email_jobs_attempts_nonneg
    CHECK (attempts >= 0),
  CONSTRAINT email_jobs_max_attempts_positive
    CHECK (max_attempts > 0),
  CONSTRAINT email_jobs_sender_email_format
    CHECK (sender_email IS NULL OR sender_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT email_jobs_recipient_email_format
    CHECK (recipient_email IS NULL OR recipient_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT email_jobs_message_length
    CHECK (message IS NULL OR char_length(message) <= 10000),
  -- Contact form jobs must have sender info; transactional must have recipient
  CONSTRAINT email_jobs_contact_form_fields
    CHECK (
      job_type != 'contact_form'
      OR (sender_name IS NOT NULL AND sender_email IS NOT NULL AND message IS NOT NULL)
    ),
  CONSTRAINT email_jobs_transactional_fields
    CHECK (
      job_type NOT IN ('transactional', 'magic_link')
      OR (recipient_email IS NOT NULL AND subject IS NOT NULL)
    )
);

-- Worker queue polling: find jobs ready to process.
-- This is the most performance-critical index in the system.
-- Partial index on queued/processing jobs only (the hot path).
CREATE INDEX email_jobs_queue_idx
  ON email_jobs (status, next_retry_at NULLS FIRST, created_at)
  WHERE status IN ('queued', 'processing');

-- Admin: recent email activity
CREATE INDEX email_jobs_created_at_idx
  ON email_jobs (created_at DESC);

-- Rate limiting: count today's contact form submissions
CREATE INDEX email_jobs_daily_count_idx
  ON email_jobs (created_at)
  WHERE job_type = 'contact_form';

CREATE TRIGGER email_jobs_updated_at
  BEFORE UPDATE ON email_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE email_jobs IS 'Email queue and history. Replaces Redis hashes + RabbitMQ. Worker polls for queued rows.';
COMMENT ON COLUMN email_jobs.status IS 'queued = waiting, processing = worker claimed it, sent = done, failed = retries exhausted, dead = manually abandoned.';
COMMENT ON COLUMN email_jobs.next_retry_at IS 'Exponential backoff: 30s, 2min, 10min. NULL means ready now.';

-- ============================================================================
-- 7. auth_tokens
-- ============================================================================
-- Magic link authentication tokens. Stateless auth:
-- 1. User requests login -> token created, email sent
-- 2. User clicks link -> token validated -> JWT issued
-- 3. Token marked as used (one-time use)
--
-- Tokens expire after 15 minutes and are single-use.
-- Old tokens are periodically cleaned up by a cron job or on-read.

CREATE TABLE auth_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                  -- CASCADE: deleting a user should clean up their tokens

  -- Token value: stored as a SHA-256 hash of the actual token.
  -- The raw token is sent in the email link; we never store it in plaintext.
  -- Lookup: hash the incoming token, match against this column.
  token_hash      TEXT NOT NULL,

  -- Token lifecycle
  expires_at      TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ,         -- NULL = unused, timestamp = when it was consumed

  -- Security metadata
  ip_address      TEXT,                -- IP that requested the magic link
  user_agent      TEXT,                -- browser that requested it

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT auth_tokens_expires_future
    CHECK (expires_at > created_at),
  CONSTRAINT auth_tokens_hash_length
    CHECK (char_length(token_hash) = 64) -- SHA-256 hex digest is always 64 chars
);

-- Token lookup: find token by hash (the primary auth operation)
CREATE UNIQUE INDEX auth_tokens_hash_idx
  ON auth_tokens (token_hash);

-- Cleanup: find expired/used tokens for periodic deletion
CREATE INDEX auth_tokens_expires_idx
  ON auth_tokens (expires_at)
  WHERE used_at IS NULL;

-- Security: find recent tokens for a user (prevent token flooding)
CREATE INDEX auth_tokens_user_id_idx
  ON auth_tokens (user_id, created_at DESC);

COMMENT ON TABLE auth_tokens IS 'Magic link auth tokens. SHA-256 hashed, single-use, 15-minute expiry.';
COMMENT ON COLUMN auth_tokens.token_hash IS 'SHA-256 hex digest of the raw token. Raw token is sent in email, never stored.';

-- ============================================================================
-- 8. content_requests
-- ============================================================================
-- Post-launch content update requests from clients.
-- Client submits "change my phone number" or "add a new menu item" through
-- the client portal. Operator reviews and applies the change.

CREATE TABLE content_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Request details
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,       -- what the client wants changed

  -- Optional file attachments (references to DO Spaces objects)
  -- Array of object keys like ["uploads/proj-abc/logo-v2.png"]
  attachments     JSONB NOT NULL DEFAULT '[]',

  -- Status tracking
  status          TEXT NOT NULL DEFAULT 'pending',

  -- Operator response
  admin_response  TEXT,                -- operator's reply to the client
  completed_at    TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT content_requests_title_length
    CHECK (char_length(title) BETWEEN 1 AND 300),
  CONSTRAINT content_requests_description_length
    CHECK (char_length(description) BETWEEN 1 AND 5000),
  CONSTRAINT content_requests_status_valid
    CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  CONSTRAINT content_requests_admin_response_length
    CHECK (admin_response IS NULL OR char_length(admin_response) <= 2000)
);

-- Client portal: "my requests" for a project
CREATE INDEX content_requests_project_idx
  ON content_requests (project_id, created_at DESC);

-- Admin dashboard: pending requests needing attention
CREATE INDEX content_requests_status_idx
  ON content_requests (status, created_at)
  WHERE status IN ('pending', 'in_progress');

-- Client portal: all requests by user
CREATE INDEX content_requests_user_idx
  ON content_requests (user_id, created_at DESC);

CREATE TRIGGER content_requests_updated_at
  BEFORE UPDATE ON content_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE content_requests IS 'Client-submitted content change requests for live projects.';
COMMENT ON COLUMN content_requests.attachments IS 'JSON array of DO Spaces object keys for uploaded files.';

-- ============================================================================
-- 9. admin_notes
-- ============================================================================
-- Internal notes the operator attaches to users or projects.
-- Not visible to clients. Used for CRM context:
-- "Spoke on phone, wants blue color scheme" or "Waiting for logo from client".

CREATE TABLE admin_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic reference: a note is attached to either a user or a project (or both).
  -- At least one must be non-null.
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
                  -- CASCADE: if the parent is deleted, notes go with it.
                  -- These are operator-only notes, not client data.

  -- Note content
  content         TEXT NOT NULL,
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT admin_notes_has_parent
    CHECK (user_id IS NOT NULL OR project_id IS NOT NULL),
  CONSTRAINT admin_notes_content_length
    CHECK (char_length(content) BETWEEN 1 AND 10000)
);

-- Admin: notes for a specific user
CREATE INDEX admin_notes_user_idx
  ON admin_notes (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Admin: notes for a specific project
CREATE INDEX admin_notes_project_idx
  ON admin_notes (project_id, created_at DESC)
  WHERE project_id IS NOT NULL;

-- Admin: pinned notes bubble to top
CREATE INDEX admin_notes_pinned_idx
  ON admin_notes (is_pinned DESC, created_at DESC);

CREATE TRIGGER admin_notes_updated_at
  BEFORE UPDATE ON admin_notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE admin_notes IS 'Internal operator notes on users/projects. Not visible to clients.';

-- ============================================================================
-- 10. Validation triggers
-- ============================================================================

-- Prevent backward status transitions on projects.
-- The pipeline is strictly forward-moving (with the exception of
-- in_review -> revisions -> in_review cycles).
CREATE OR REPLACE FUNCTION check_project_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  allowed_transitions JSONB := '{
    "draft":           ["building", "cancelled"],
    "building":        ["preview", "draft"],
    "preview":         ["building", "lead", "paid", "live", "cancelled"],
    "lead":            ["paid", "cancelled"],
    "paid":            ["brief_received", "cancelled"],
    "brief_received":  ["draft_ready", "cancelled"],
    "draft_ready":     ["in_review", "cancelled"],
    "in_review":       ["revisions", "live", "cancelled"],
    "revisions":       ["in_review", "cancelled"],
    "live":            ["maintenance"],
    "maintenance":     [],
    "cancelled":       []
  }';
  allowed JSONB;
BEGIN
  -- Skip if status did not change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  allowed := allowed_transitions -> OLD.status;

  IF allowed IS NULL OR NOT allowed ? NEW.status THEN
    RAISE EXCEPTION 'Invalid project status transition: % -> %', OLD.status, NEW.status
      USING HINT = 'Check allowed transitions in check_project_status_transition()';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_status_transition
  BEFORE UPDATE OF status ON projects
  FOR EACH ROW EXECUTE FUNCTION check_project_status_transition();

-- Automatically set pipeline timestamps when status changes
CREATE OR REPLACE FUNCTION set_project_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'paid' THEN
        NEW.paid_at := COALESCE(NEW.paid_at, NOW());
      WHEN 'brief_received' THEN
        NEW.brief_received_at := COALESCE(NEW.brief_received_at, NOW());
      WHEN 'draft_ready' THEN
        NEW.draft_ready_at := COALESCE(NEW.draft_ready_at, NOW());
      WHEN 'live' THEN
        NEW.launched_at := COALESCE(NEW.launched_at, NOW());
      WHEN 'cancelled' THEN
        NEW.cancelled_at := COALESCE(NEW.cancelled_at, NOW());
      ELSE
        -- no automatic timestamp for other statuses
        NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_status_timestamps
  BEFORE UPDATE OF status ON projects
  FOR EACH ROW EXECUTE FUNCTION set_project_status_timestamps();

-- Prevent claiming a used or expired auth token
CREATE OR REPLACE FUNCTION validate_auth_token_use()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'Auth token has already been used'
      USING HINT = 'Each magic link token can only be used once.';
  END IF;

  IF OLD.expires_at < NOW() THEN
    RAISE EXCEPTION 'Auth token has expired'
      USING HINT = 'Token expired at %', OLD.expires_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auth_tokens_validate_use
  BEFORE UPDATE OF used_at ON auth_tokens
  FOR EACH ROW
  WHEN (NEW.used_at IS NOT NULL AND OLD.used_at IS NULL)
  EXECUTE FUNCTION validate_auth_token_use();

-- ============================================================================
-- 11. Performance: connection pooling note
-- ============================================================================
-- On the db-s-1vcpu-1gb plan, DigitalOcean sets max_connections to ~25.
-- The Node.js backend should use a connection pool size of 5-10.
-- If connection pressure grows, add PgBouncer in transaction pooling mode
-- as a sidecar container in docker-compose.yml.
--
-- Prisma uses @prisma/adapter-pg with a pg Pool.
-- Recommended pool config: { max: 5, idleTimeoutMillis: 30000 }
-- ============================================================================

-- ============================================================================
-- ROLLBACK / DOWN MIGRATION
-- ============================================================================
-- To reverse this migration, run the following in order:
--
-- DROP TRIGGER IF EXISTS auth_tokens_validate_use ON auth_tokens;
-- DROP TRIGGER IF EXISTS projects_status_timestamps ON projects;
-- DROP TRIGGER IF EXISTS projects_status_transition ON projects;
-- DROP TRIGGER IF EXISTS admin_notes_updated_at ON admin_notes;
-- DROP TRIGGER IF EXISTS content_requests_updated_at ON content_requests;
-- DROP TRIGGER IF EXISTS email_jobs_updated_at ON email_jobs;
-- DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
-- DROP TRIGGER IF EXISTS projects_updated_at ON projects;
-- DROP TRIGGER IF EXISTS users_updated_at ON users;
-- DROP FUNCTION IF EXISTS validate_auth_token_use();
-- DROP FUNCTION IF EXISTS set_project_status_timestamps();
-- DROP FUNCTION IF EXISTS check_project_status_transition();
-- DROP TABLE IF EXISTS admin_notes;
-- DROP TABLE IF EXISTS content_requests;
-- DROP TABLE IF EXISTS auth_tokens;
-- DROP TABLE IF EXISTS email_jobs;
-- DROP TABLE IF EXISTS payments;
-- DROP TABLE IF EXISTS subscriptions;
-- DROP TABLE IF EXISTS projects;
-- DROP TABLE IF EXISTS users;
-- DROP FUNCTION IF EXISTS set_updated_at();
-- ============================================================================
