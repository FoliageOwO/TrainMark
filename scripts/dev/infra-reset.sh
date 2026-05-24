#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${TRAINMARK_COMPOSE_FILE:-$ROOT_DIR/infra/docker-compose.yml}"

echo "[infra:reset] Stopping local infrastructure and removing volumes"
docker compose -f "$COMPOSE_FILE" down -v

echo "[infra:reset] Starting local infrastructure"
docker compose -f "$COMPOSE_FILE" up -d

echo "[infra:reset] Done"
