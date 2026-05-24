#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="$ROOT_DIR/.logs/backend"
mkdir -p "$LOG_DIR"

services=(
  gateway-service
  auth-service
  user-service
  course-service
  file-service
  grading-service
  ocr-service
  similarity-service
  analytics-service
  notification-service
  admin-service
)

pids=()

stop_services() {
  if ((${#pids[@]} > 0)); then
    kill "${pids[@]}" 2>/dev/null || true
  fi
}

trap stop_services EXIT INT TERM

echo "Starting backend services. Logs: $LOG_DIR"

# Install the parent POM and shared module once so service launches can reuse them.
mvn -f "$ROOT_DIR/backend/pom.xml" -N install
mvn -f "$ROOT_DIR/backend/shared/pom.xml" install -DskipTests

for service in "${services[@]}"; do
  log_file="$LOG_DIR/$service.log"
  : > "$log_file"
  (
    cd "$ROOT_DIR"
    TRAINMARK_SKIP_BOOTSTRAP=1 bash "$ROOT_DIR/scripts/dev/backend-service.sh" "$service"
  ) > "$log_file" 2>&1 &
  pid=$!
  pids+=("$pid")
  printf '  %-22s pid=%s log=%s\n' "$service" "$pid" "$log_file"
done

echo
echo "Press Ctrl+C to stop all backend services."

set +e
wait -n "${pids[@]}"
status=$?
set -e

echo "A backend service exited with status $status. Stopping the rest."
exit "$status"
