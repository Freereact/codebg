-- ============================================================================
-- CodeBG Initial Schema — ROLLBACK (DOWN) Migration
-- Reverses 001_initial_schema.sql
-- ============================================================================
--
-- WARNING: This destroys all data. Use only in development or with a verified
-- backup. In production, prefer data-preserving migrations.
-- ============================================================================

-- 1. Drop triggers first (they reference functions and tables)
DROP TRIGGER IF EXISTS auth_tokens_validate_use ON auth_tokens;
DROP TRIGGER IF EXISTS projects_status_timestamps ON projects;
DROP TRIGGER IF EXISTS projects_status_transition ON projects;
DROP TRIGGER IF EXISTS admin_notes_updated_at ON admin_notes;
DROP TRIGGER IF EXISTS content_requests_updated_at ON content_requests;
DROP TRIGGER IF EXISTS email_jobs_updated_at ON email_jobs;
DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS projects_updated_at ON projects;
DROP TRIGGER IF EXISTS users_updated_at ON users;

-- 2. Drop trigger functions
DROP FUNCTION IF EXISTS validate_auth_token_use();
DROP FUNCTION IF EXISTS set_project_status_timestamps();
DROP FUNCTION IF EXISTS check_project_status_transition();
DROP FUNCTION IF EXISTS set_updated_at();

-- 3. Drop tables in reverse dependency order
DROP TABLE IF EXISTS admin_notes;
DROP TABLE IF EXISTS content_requests;
DROP TABLE IF EXISTS auth_tokens;
DROP TABLE IF EXISTS email_jobs;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
