#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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

mvn -f "$ROOT_DIR/backend/pom.xml" package -DskipTests

for service in "${services[@]}"; do
  log_file="$LOG_DIR/$service.log"
  jar_file="$ROOT_DIR/backend/$service/target/$service-0.1.0-SNAPSHOT.jar"
  if [[ ! -f "$jar_file" ]]; then
    echo "Missing packaged jar: $jar_file" >&2
    exit 1
  fi
  : > "$log_file"
  (
    cd "$ROOT_DIR"
    java -jar "$jar_file"
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
