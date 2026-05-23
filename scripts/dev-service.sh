#!/usr/bin/env bash
set -euo pipefail

if (($# != 1)); then
  echo "Usage: $0 <service-name>" >&2
  exit 2
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE="$1"

cd "$ROOT_DIR"

mvn -f backend/pom.xml -N install
mvn -f backend/shared/pom.xml install -DskipTests
mvn -f "backend/$SERVICE/pom.xml" -Pdev spring-boot:run
