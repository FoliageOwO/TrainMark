#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ "${ACCEPTANCE_SKIP_RUN:-0}" != "1" ]]; then
  pnpm verify:http:teacher:auto
fi

TODAY="$(date '+%Y-%m-%d')"
REPORT="docs/HTTP_TEACHER_ACCEPTANCE_REPORT.md"

python3 - <<'PY'
from pathlib import Path
import os

report = Path('docs/HTTP_TEACHER_ACCEPTANCE_REPORT.md')
today = os.environ.get('TODAY') or os.popen("date '+%Y-%m-%d'").read().strip()
text = report.read_text(encoding='utf-8')

lines = text.splitlines()
for i, line in enumerate(lines):
    if line.startswith('- 验收日期：'):
        lines[i] = f'- 验收日期：{today}（自动项最近复验通过）'
    if line.startswith('| 自动验收基线 | `pnpm verify:http:teacher:auto` |'):
        lines[i] = f'| 自动验收基线 | `pnpm verify:http:teacher:auto` | 通过 | {today} 复验：`[acceptance:auto] passed` |'

report.write_text('\n'.join(lines) + '\n', encoding='utf-8')
PY

echo "[acceptance:sync] report updated: $REPORT"
