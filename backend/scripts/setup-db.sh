#!/usr/bin/env bash
# setup-db.sh — Apply SQL migrations to the database
#
# Usage:
#   ./scripts/setup-db.sh                    # reads DATABASE_URL from .env
#   DATABASE_URL="postgresql://..." ./scripts/setup-db.sh   # explicit URL
#
# This script is idempotent for the initial migration — PostgreSQL will
# error on "already exists" for tables/functions that are already created,
# but will not lose data. For a truly clean setup, run the down migration first.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Load DATABASE_URL from .env if not already set
if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f "$BACKEND_DIR/.env" ]; then
    DATABASE_URL=$(grep -E '^DATABASE_URL=' "$BACKEND_DIR/.env" | cut -d= -f2-)
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL not set. Either export it or add it to backend/.env"
  exit 1
fi

MIGRATION_FILE="$BACKEND_DIR/migrations/001_initial_schema.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "ERROR: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "Applying migration: 001_initial_schema.sql"
echo "Database: $(echo "$DATABASE_URL" | sed 's|://[^@]*@|://***@|')"

psql "$DATABASE_URL" -f "$MIGRATION_FILE"

echo ""
echo "Verifying tables..."
psql "$DATABASE_URL" -c "\dt public.*" --no-psqlrc

echo ""
echo "Database setup complete."
