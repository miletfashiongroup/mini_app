#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$REPO_ROOT/packages/frontend"

if [ ! -f "$REPO_ROOT/packages/backend/openapi.yaml" ]; then
  echo "Missing backend OpenAPI spec. Generate packages/backend/openapi.yaml first." >&2
  exit 1
fi

# PRINCIPAL-NOTE: Contracts stay in sync by regenerating TS types from the backend spec.
npx openapi-typescript "$REPO_ROOT/packages/backend/openapi.yaml" --output src/shared/api/generated.ts
