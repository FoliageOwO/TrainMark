#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
TODAY="$(date +%F)"
TARGET_DIR="docs/evidence/http-acceptance/${TODAY}"
mkdir -p "$TARGET_DIR"
INDEX_FILE="$TARGET_DIR/INDEX.md"
cat > "$INDEX_FILE" <<'MD'
# HTTP Manual Evidence Index

## Teacher (B)
- [ ] B5-01-dashboard-next-action-pass.png
- [ ] B6-01-checklist-navigation-pass.png
- [ ] B7-01-assignment-create-pass.png
- [ ] B7-02-assignment-publish-pass.png
- [ ] B8-01-reminder-fail-message-pass.png
- [ ] B9-01-ai-start-or-fail-message-pass.png
- [ ] B10-01-review-approve-pass.png
- [ ] B10-02-review-publish-pass.png
- [ ] B10-03-review-withdraw-pass.png

## Student (S)
- [ ] S3-01-no-task-blocked-pass.png
- [ ] S3-02-upload-receipt-pass.png
MD

echo "[init-http-evidence-index] created: $INDEX_FILE"
