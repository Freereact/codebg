-- 002_custom_domains.sql
-- Adds custom domain tracking fields to the projects table.
-- The `domain` column already exists from 001_initial_schema.sql.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_status TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_error TEXT;

-- Validate domain_status values
ALTER TABLE projects ADD CONSTRAINT projects_domain_status_valid
  CHECK (domain_status IS NULL OR domain_status IN (
    'pending', 'dns_verified', 'ssl_provisioning', 'active', 'error'
  ));

-- Index for finding projects by domain status (e.g. pending provisioning)
CREATE INDEX IF NOT EXISTS projects_domain_status_idx
  ON projects (domain_status)
  WHERE domain_status IS NOT NULL AND deleted_at IS NULL;

COMMENT ON COLUMN projects.domain_status IS 'Custom domain setup status: pending, dns_verified, ssl_provisioning, active, error';
COMMENT ON COLUMN projects.domain_error IS 'Last error message from domain provisioning (null when status is active)';
