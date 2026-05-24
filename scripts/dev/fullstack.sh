#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="$ROOT_DIR/.logs"
BACKEND_LOG="$LOG_DIR/dev-mvp-backend.log"

mkdir -p "$LOG_DIR"

backend_pid=""

stop_backend() {
  if [[ -n "$backend_pid" ]]; then
    kill "$backend_pid" 2>/dev/null || true
    wait "$backend_pid" 2>/dev/null || true
  fi
}

trap stop_backend EXIT INT TERM

cd "$ROOT_DIR"

echo "[start:stack:http] Starting backend services"
bash scripts/dev/backend-all.sh > "$BACKEND_LOG" 2>&1 &
backend_pid="$!"

echo "[start:stack:http] Backend supervisor pid=$backend_pid"
echo "[start:stack:http] Backend supervisor log: $BACKEND_LOG"
echo "[start:stack:http] Service logs: $ROOT_DIR/.logs/backend"
echo "[start:stack:http] Waiting for API smoke checks"

SMOKE_RETRIES="${SMOKE_RETRIES:-60}" \
SMOKE_RETRY_DELAY_SECONDS="${SMOKE_RETRY_DELAY_SECONDS:-2}" \
pnpm smoke:api

if [[ "${TRAINMARK_STRICT_AUTH_SMOKE:-0}" == "1" ]]; then
  echo "[start:stack:http] Running strict auth smoke checks"
  pnpm smoke:auth:strict
fi

echo "[start:stack:http] API is ready"

if [[ "${TRAINMARK_MVP_SMOKE_ONLY:-0}" == "1" ]]; then
  echo "[start:stack:http] Smoke-only mode completed"
  exit 0
fi

echo "[start:stack:http] Starting web app in HTTP mode"

VITE_API_MODE="${VITE_API_MODE:-http}" \
VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://localhost:8080}" \
VITE_API_STRICT_HTTP="${VITE_API_STRICT_HTTP:-1}" \
pnpm dev:web
