#!/usr/bin/env bash
set -euo pipefail

if (($# != 1)); then
  echo "Usage: $0 <service-name>" >&2
  exit 2
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVICE="$1"

cd "$ROOT_DIR"

if [[ "${TRAINMARK_SKIP_BOOTSTRAP:-0}" != "1" ]]; then
  mvn -f backend/pom.xml -N install
  mvn -f backend/shared/pom.xml install -DskipTests
  MVN_PROJECT_ARGS=(-pl "$SERVICE" -am)
else
  # backend-all.sh installs the shared module once before launching services.
  # Avoid packaging upstream modules in parallel because concurrent Maven runs
  # can race on backend/shared/target and corrupt the jar assembly.
  MVN_PROJECT_ARGS=(-pl "$SERVICE")
fi

mvn -f "backend/pom.xml" "${MVN_PROJECT_ARGS[@]}" package -DskipTests
exec java -jar "backend/$SERVICE/target/$SERVICE-0.1.0-SNAPSHOT.jar"
