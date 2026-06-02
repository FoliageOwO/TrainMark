#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

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

echo "[verify] HTTP auth UI guard + strict auth smoke"
pnpm verify:http:auth-ui-guards

echo "[verify] Teacher workflow guides"
pnpm verify:teacher-workflow-guides
pnpm verify:student-workflow-guides
pnpm verify:student-results:no-mock-copy

echo "[verify] HTTP API strict write/no-degrade guards"
pnpm verify:httpapi:strict-writes
pnpm verify:httpapi:no-degradable-calls
pnpm verify:httpapi:no-relaxed-read
pnpm verify:http:workspace-error-no-clear

echo "[verify] API route surface"
if command -v rg >/dev/null 2>&1; then
  rg -n "@(GetMapping|PostMapping|PatchMapping|RequestMapping)" backend/*-service/src/main/java -g "*.java" >/dev/null
else
  find backend -path "backend/*-service/src/main/java/*" -name "*.java" \
    -exec grep -En "@(GetMapping|PostMapping|PatchMapping|RequestMapping)" {} + >/dev/null
fi

echo "[verify] MVP launcher scripts"
bash -n scripts/ops/db-migrate-local.sh
bash -n scripts/dev/fullstack.sh
bash -n scripts/dev/fullstack-jdbc.sh

echo "[verify] MVP verification completed"
