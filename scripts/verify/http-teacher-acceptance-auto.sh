#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[acceptance:auto] 1/4 strict write guard"
pnpm verify:httpapi:strict-writes
pnpm verify:httpapi:no-degradable-calls
pnpm verify:httpapi:no-relaxed-read

echo "[acceptance:auto] 2/4 auth ui guards + strict auth smoke"
pnpm verify:http:auth-ui-guards
pnpm verify:role-section-guards

echo "[acceptance:auto] 3/4 teacher workflow guides"
pnpm verify:teacher-workflow-guides
pnpm verify:student-workflow-guides
pnpm verify:student-results:no-mock-copy
pnpm verify:http:workspace-http-branch
pnpm verify:http:workspace-strict-reads
pnpm verify:http:workspace-error-no-clear

echo "[acceptance:auto] 4/4 frontend production build"
pnpm --filter trainmark-ai-web build

echo "[acceptance:auto] passed"
