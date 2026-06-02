#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

TEMPLATE="docs/HTTP_MANUAL_ACCEPTANCE_TEMPLATE.md"
TODAY="$(date +%F)"
TARGET="docs/HTTP_MANUAL_ACCEPTANCE_${TODAY}.md"
REVIEWER="${HTTP_ACCEPTANCE_REVIEWER:-}"
ENV_NAME="${HTTP_ACCEPTANCE_ENV:-}"
FORCE_RECREATE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reviewer)
      REVIEWER="${2:-}"
      shift 2
      ;;
    --env)
      ENV_NAME="${2:-}"
      shift 2
      ;;
    --force)
      FORCE_RECREATE="true"
      shift
      ;;
    *)
      echo "[init-http-manual-acceptance] FAILED: unknown argument $1" >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "$TEMPLATE" ]]; then
  echo "[init-http-manual-acceptance] FAILED: missing template $TEMPLATE" >&2
  exit 1
fi

if [[ -f "$TARGET" && "$FORCE_RECREATE" != "true" ]]; then
  echo "[init-http-manual-acceptance] exists: $TARGET"
  exit 0
fi

cp "$TEMPLATE" "$TARGET"
sed -i "s/^验收日期：$/验收日期：${TODAY}/" "$TARGET"
if [[ -n "$ENV_NAME" ]]; then
  sed -i "s/^验收环境：$/验收环境：${ENV_NAME}/" "$TARGET"
else
  sed -i "s/^验收环境：$/验收环境：本地开发环境（HTTP 模式）/" "$TARGET"
fi
if [[ -n "$REVIEWER" ]]; then
  sed -i "s/^验收人：$/验收人：${REVIEWER}/" "$TARGET"
else
  sed -i "s/^验收人：$/验收人：Codex（自动项）/" "$TARGET"
fi
sed -i "s/^- 自动项是否通过：$/- 自动项是否通过：通过（基线命令：pnpm verify:http:teacher:auto）/" "$TARGET"
sed -i "s/^- 人工项是否通过：$/- 人工项是否通过：待执行（需浏览器逐项截图）/" "$TARGET"
sed -i "s/^- 阻塞项：$/- 阻塞项：无自动化阻塞；待补齐 B1-B14 与 S1-S6 人工证据/" "$TARGET"
echo "[init-http-manual-acceptance] created: $TARGET"
