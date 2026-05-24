#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${TRAINMARK_COMPOSE_FILE:-$ROOT_DIR/infra/docker-compose.yml}"

echo "[infra:restart] Stopping local infrastructure"
docker compose -f "$COMPOSE_FILE" down

echo "[infra:restart] Starting local infrastructure"
docker compose -f "$COMPOSE_FILE" up -d

echo "[infra:restart] Done"
