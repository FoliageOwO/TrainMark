#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_ROOT="${DEPLOY_ROOT:-$ROOT_DIR/deployments}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
RELEASE_DIR="${RELEASE_DIR:-$DEPLOY_ROOT/$TIMESTAMP}"

cd "$ROOT_DIR"

echo "[deploy] Building frontend"
pnpm build:web

echo "[deploy] Building backend"
pnpm build:backend

mkdir -p "$RELEASE_DIR/frontend" "$RELEASE_DIR/backend" "$RELEASE_DIR/infra" "$RELEASE_DIR/docs"

echo "[deploy] Copying frontend dist"
cp -R apps/web/dist/. "$RELEASE_DIR/frontend/"

echo "[deploy] Copying backend service jars"
find backend -path "*/target/*.jar" \
  ! -name "*-sources.jar" \
  ! -name "*-javadoc.jar" \
  -exec cp {} "$RELEASE_DIR/backend/" \;

echo "[deploy] Copying infra and docs"
cp -R infra/. "$RELEASE_DIR/infra/"
cp README.md PROJECT.md PROGRESS.md "$RELEASE_DIR/docs/"
cp docs/API.md "$RELEASE_DIR/docs/API.md"

cat > "$RELEASE_DIR/manifest.txt" <<MANIFEST
TrainMark AI local release
created_at=$TIMESTAMP
frontend=frontend/
backend=backend/
infra=infra/
docs=docs/
MANIFEST

echo "[deploy] Release package ready: $RELEASE_DIR"
