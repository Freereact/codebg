#!/bin/bash
set -euo pipefail

# Auto-discover customers from src/customers/*/meta.json
# No hardcoded slug map — add a directory + meta.json and it builds automatically.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CUSTOMERS_DIR="$SCRIPT_DIR/src/customers"

count=0
for meta in "$CUSTOMERS_DIR"/*/meta.json; do
  customer="$(basename "$(dirname "$meta")")"
  slug="$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('$meta','utf-8')).slug)")"

  echo "Building $customer → dist/$slug/"
  VITE_CUSTOMER="$customer" npx vite build \
    --base="/$slug/" \
    --outDir="dist/$slug"
  count=$((count + 1))
done

echo "All builds complete ($count customers)."
