#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
AUTH_JAR="$ROOT_DIR/backend/auth-service/target/auth-service-0.1.0-SNAPSHOT.jar"
AUTH_PID=""

cleanup() {
  if [[ -n "$AUTH_PID" ]] && kill -0 "$AUTH_PID" >/dev/null 2>&1; then
    kill "$AUTH_PID" >/dev/null 2>&1 || true
    wait "$AUTH_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

cd "$ROOT_DIR/backend"
mvn -pl auth-service -am -DskipTests package >/dev/null

cd "$ROOT_DIR"
TRAINMARK_AUTH_STORE=memory java -jar "$AUTH_JAR" >/tmp/auth-service-smoke.log 2>&1 &
AUTH_PID=$!

for _ in {1..60}; do
  if curl --noproxy '*' -fsS http://localhost:8081/actuator/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

curl --noproxy '*' -fsS http://localhost:8081/actuator/health >/dev/null
pnpm smoke:auth:strict

echo "[auth-strict-local] smoke passed"
