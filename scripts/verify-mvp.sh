#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

echo "[verify] Frontend lint"
pnpm lint:web

echo "[verify] Frontend build"
pnpm build:web

echo "[verify] Backend package"
mvn -f backend/pom.xml package -DskipTests

echo "[verify] AI providers"
pnpm verify:ai

echo "[verify] API smoke endpoint list"
SMOKE_DRY_RUN=1 pnpm smoke:api

echo "[verify] API write smoke endpoint list"
SMOKE_DRY_RUN=1 SMOKE_INCLUDE_WRITES=1 pnpm smoke:api

echo "[verify] Strict auth smoke endpoint list"
SMOKE_DRY_RUN=1 pnpm smoke:auth:strict

echo "[verify] API route surface"
if command -v rg >/dev/null 2>&1; then
  rg -n "@(GetMapping|PostMapping|PatchMapping|RequestMapping)" backend/*-service/src/main/java -g "*.java" >/dev/null
else
  find backend -path "backend/*-service/src/main/java/*" -name "*.java" \
    -exec grep -En "@(GetMapping|PostMapping|PatchMapping|RequestMapping)" {} + >/dev/null
fi

echo "[verify] MVP launcher scripts"
bash -n scripts/apply-db-migrations.sh
bash -n scripts/dev-mvp.sh
bash -n scripts/dev-mvp-jdbc.sh

echo "[verify] MVP verification completed"
