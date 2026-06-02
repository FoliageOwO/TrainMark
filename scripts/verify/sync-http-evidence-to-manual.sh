#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
TODAY="$(date +%F)"
INDEX="docs/evidence/http-acceptance/${TODAY}/INDEX.md"
MANUAL="docs/HTTP_MANUAL_ACCEPTANCE_${TODAY}.md"

if [[ ! -f "$INDEX" || ! -f "$MANUAL" ]]; then
  echo "[sync-http-evidence] missing INDEX or MANUAL for $TODAY" >&2
  exit 1
fi

mark_done() {
  local key="$1"
  local row="$2"
  if rg -n "^- \[x\] ${key}" "$INDEX" >/dev/null; then
    sed -i "s|${row} |${row} 已补图 |" "$MANUAL"
  fi
}

mark_done "B5-01-dashboard-next-action-pass.png" "| B5 |"
mark_done "B6-01-checklist-navigation-pass.png" "| B6 |"
mark_done "B7-01-assignment-create-pass.png" "| B7 |"
mark_done "B8-01-reminder-fail-message-pass.png" "| B8 |"
mark_done "B9-01-ai-start-or-fail-message-pass.png" "| B9 |"
mark_done "B10-01-review-approve-pass.png" "| B10 |"
mark_done "S3-01-no-task-blocked-pass.png" "| S3 |"

echo "[sync-http-evidence] synced from $INDEX to $MANUAL"
