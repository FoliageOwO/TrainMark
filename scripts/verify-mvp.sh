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

echo "[verify] API route surface"
rg -n "@(GetMapping|PostMapping|PatchMapping|RequestMapping)" backend/*-service/src/main/java -g "*.java" >/dev/null

echo "[verify] MVP verification completed"
