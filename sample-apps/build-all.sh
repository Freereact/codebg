#!/bin/bash
set -euo pipefail

declare -A SLUG_MAP=(
  [autoshop]=autoshop
  [dental]=dental-cabinet
  [winery]=winery
  [massage]=massage-service
  [bakery]=bakery-service
)

for customer in "${!SLUG_MAP[@]}"; do
  slug="${SLUG_MAP[$customer]}"
  echo "Building $customer → dist/$slug/"
  VITE_CUSTOMER="$customer" npx vite build \
    --base="/customers/$slug/" \
    --outDir="dist/$slug"
done

echo "All builds complete."
