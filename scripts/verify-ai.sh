#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
BRIDGE_PID=""

cleanup() {
  if [[ -n "$BRIDGE_PID" ]]; then
    kill "$BRIDGE_PID" 2>/dev/null || true
  fi
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT
export PYTHONIOENCODING="${PYTHONIOENCODING:-utf-8}"

REAL_AI_ARGS=()
if [[ "${TRAINMARK_REQUIRE_REAL_AI:-0}" == "1" ]]; then
  REAL_AI_ARGS=(--require-real)
fi

PYTHON_BIN="${PYTHON_BIN:-}"
if [[ -z "$PYTHON_BIN" ]]; then
  for candidate in python3 python py; do
    if command -v "$candidate" >/dev/null 2>&1 && "$candidate" --version >/dev/null 2>&1; then
      PYTHON_BIN="$candidate"
      break
    fi
  done
fi

if [[ -z "$PYTHON_BIN" ]]; then
  echo "[verify:ai] Python 3 is required. Set PYTHON_BIN to a Python executable." >&2
  exit 1
fi

cd "$ROOT_DIR"

json_field_exists() {
  local json_file="$1"
  local expression="$2"
  "$PYTHON_BIN" - "$json_file" "$expression" <<'PY'
import json
import sys

path = sys.argv[1]
expression = sys.argv[2]

with open(path, "r", encoding="utf-8") as file:
    payload = json.load(file)

safe_builtins = {"len": len, "any": any, "all": all}
if not eval(expression, {"__builtins__": safe_builtins}, {"payload": payload}):
    print(f"[verify:ai] JSON assertion failed: {expression}", file=sys.stderr)
    sys.exit(1)
PY
}

require_no_ai_fallback() {
  local label="$1"
  local json_file="$2"
  if [[ "${TRAINMARK_REQUIRE_REAL_AI:-0}" != "1" ]]; then
    return 0
  fi
  "$PYTHON_BIN" - "$label" "$json_file" <<'PY'
import json
import sys

label = sys.argv[1]
path = sys.argv[2]

with open(path, "r", encoding="utf-8") as file:
    payload = json.load(file)

fallback_terms = ("fallback", "deterministic", "兜底")


def strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for item in value.values():
            yield from strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from strings(item)


matches = [
    value for value in strings(payload)
    if any(term in value.casefold() for term in fallback_terms)
]
if matches:
    print(f"[verify:ai] {label} is still using fallback output", file=sys.stderr)
    for value in matches[:5]:
        print(f"  - {value}", file=sys.stderr)
    sys.exit(1)
PY
}

echo "[verify:ai] Python executable: $PYTHON_BIN"

echo "[verify:ai] Python syntax"
"$PYTHON_BIN" -m py_compile \
  ai/document/local_converter.py \
  ai/ocr/local_provider.py \
  ai/ocr/paddleocr_provider.py \
  ai/scoring/local_provider.py \
  ai/scoring/semantic_provider.py \
  ai/bridge_server.py \
  ai/annotation/local_provider.py

echo "[verify:ai] Document preprocessing"
"$PYTHON_BIN" ai/document/local_converter.py \
  --submission-id 1 \
  --object-key assignments/1/students/2/database-report.docx > "$TMP_DIR/document-docx.json"
"$PYTHON_BIN" -m json.tool "$TMP_DIR/document-docx.json" >/dev/null
grep -q '"sourceFormat": "WORD"' "$TMP_DIR/document-docx.json"
grep -q '"targetFormat": "PDF"' "$TMP_DIR/document-docx.json"
grep -q '"normalizedObjectKey": "converted/assignments/1/students/2/database-report.pdf"' "$TMP_DIR/document-docx.json"
"$PYTHON_BIN" ai/document/local_converter.py \
  --submission-id 2 \
  --object-key assignments/1/students/3/screenshot.png > "$TMP_DIR/document-image.json"
"$PYTHON_BIN" -m json.tool "$TMP_DIR/document-image.json" >/dev/null
grep -q '"sourceFormat": "IMAGE"' "$TMP_DIR/document-image.json"
grep -q '"targetFormat": "IMAGE"' "$TMP_DIR/document-image.json"

echo "[verify:ai] OCR provider"
"$PYTHON_BIN" ai/ocr/local_provider.py \
  --job-id 1001 \
  --submission-id 1 \
  --object-key assignments/1/students/2/database-report.pdf > "$TMP_DIR/ocr-result.json"
"$PYTHON_BIN" -m json.tool "$TMP_DIR/ocr-result.json" >/dev/null
"$PYTHON_BIN" ai/ocr/paddleocr_provider.py \
  --job-id 1002 \
  --submission-id 2 \
  --object-key assignments/1/students/3/screenshot.png \
  --normalized-object-key converted/assignments/1/students/3/screenshot.png \
  "${REAL_AI_ARGS[@]}" > "$TMP_DIR/paddleocr-result.json"
"$PYTHON_BIN" -m json.tool "$TMP_DIR/paddleocr-result.json" >/dev/null
json_field_exists "$TMP_DIR/ocr-result.json" "payload.get('jobId') == 1001 and len(payload.get('blocks', [])) > 0"
json_field_exists "$TMP_DIR/paddleocr-result.json" "payload.get('jobId') == 1002 and len(payload.get('blocks', [])) > 0"
if [[ "${TRAINMARK_REQUIRE_REAL_AI:-0}" == "1" ]]; then
  require_no_ai_fallback "PaddleOCR provider" "$TMP_DIR/paddleocr-result.json"
else
  grep -q 'PaddleOCR 离线兜底' "$TMP_DIR/paddleocr-result.json"
fi

echo "[verify:ai] Scoring provider"
"$PYTHON_BIN" ai/scoring/local_provider.py \
  --result-id 2001 \
  --assignment-id 1 \
  --submission-id 7 \
  --student-id 2 \
  --student-name "Zhang San" \
  --student-no 2024010101 \
  --file-name database-report.pdf \
  --rubric-file ai/scoring/sample-rubric.json > "$TMP_DIR/grading-result.json"
"$PYTHON_BIN" -m json.tool "$TMP_DIR/grading-result.json" >/dev/null
json_field_exists "$TMP_DIR/grading-result.json" "payload.get('id') == 2001 and payload.get('aiScore', 0) > 0 and len(payload.get('items', [])) > 0"
"$PYTHON_BIN" ai/scoring/semantic_provider.py \
  --result-id 2002 \
  --assignment-id 1 \
  --submission-id 8 \
  --student-id 3 \
  --student-name "Li Si" \
  --student-no 2024010102 \
  --file-name database-report.pdf \
  --rubric-file ai/scoring/sample-rubric.json \
  "${REAL_AI_ARGS[@]}" > "$TMP_DIR/semantic-grading-result.json"
"$PYTHON_BIN" -m json.tool "$TMP_DIR/semantic-grading-result.json" >/dev/null
json_field_exists "$TMP_DIR/semantic-grading-result.json" "payload.get('id') == 2002 and payload.get('aiScore', 0) > 0 and len(payload.get('items', [])) > 0"
require_no_ai_fallback "Semantic scoring provider" "$TMP_DIR/semantic-grading-result.json"

echo "[verify:ai] HTTP provider bridge"
BRIDGE_TEST_PORT="$("$PYTHON_BIN" - <<'PY'
import socket

with socket.socket() as sock:
    sock.bind(("127.0.0.1", 0))
    print(sock.getsockname()[1])
PY
)"
BRIDGE_PORT="$BRIDGE_TEST_PORT" \
TRAINMARK_REQUIRE_REAL_AI=0 \
TRAINMARK_AI_API_KEY=verify-key \
"$PYTHON_BIN" ai/bridge_server.py > "$TMP_DIR/bridge.log" 2>&1 &
BRIDGE_PID=$!

"$PYTHON_BIN" - "$BRIDGE_TEST_PORT" <<'PY'
import json
import sys
import time
import urllib.error
import urllib.request

port = sys.argv[1]
base = f"http://127.0.0.1:{port}"


def request(path, payload=None, token=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(base + path, data=data, headers=headers, method="GET" if data is None else "POST")
    with urllib.request.urlopen(req, timeout=3) as response:
        return response.status, json.loads(response.read().decode("utf-8"))


for _ in range(40):
    try:
        status, payload = request("/health")
        if status == 200 and payload["data"]["status"] == "UP":
            break
    except Exception:
        time.sleep(0.25)
else:
    raise SystemExit("AI provider bridge did not become healthy")

try:
    request("/api/ai/ocr/paddleocr", {"jobId": 1, "submissionId": 1, "objectKey": "missing.pdf"})
except urllib.error.HTTPError as error:
    if error.code != 401:
        raise
else:
    raise SystemExit("AI provider bridge accepted missing API key")

status, ocr = request(
    "/api/ai/ocr/paddleocr",
    {"jobId": 3001, "submissionId": 11, "objectKey": "database-report.pdf", "normalizedObjectKey": "missing.pdf"},
    "verify-key",
)
assert status == 200 and ocr["success"] and ocr["data"]["jobId"] == 3001 and ocr["data"]["blocks"]

rubric = {
    "totalScore": 100,
    "items": [
        {
            "id": 1,
            "title": "需求与设计",
            "score": 100,
            "points": [
                {"title": "功能模块完整", "score": 60, "keywords": ["登录", "课程", "任务", "提交"]},
                {"title": "数据库设计合理", "score": 40, "keywords": ["ER图", "表结构", "约束"]},
            ],
        }
    ],
}
status, scoring = request(
    "/api/ai/scoring/semantic",
    {
        "resultId": 3002,
        "assignmentId": 1,
        "submissionId": 12,
        "studentId": 2,
        "studentName": "张三",
        "studentNo": "2024010101",
        "fileName": "database-report.pdf",
        "fileContentText": "登录 课程 任务 提交 ER图 表结构 约束",
        "rubric": rubric,
    },
    "verify-key",
)
assert status == 200 and scoring["success"] and scoring["data"]["id"] == 3002 and scoring["data"]["items"]
PY

echo "[verify:ai] Annotation provider"
"$PYTHON_BIN" ai/annotation/local_provider.py \
  --result-id 3001 \
  --submission-id 7 \
  --student-name "Zhang San" \
  --output-dir "$TMP_DIR/annotations" > "$TMP_DIR/annotation-result.json"
"$PYTHON_BIN" -m json.tool "$TMP_DIR/annotation-result.json" >/dev/null
test -s "$TMP_DIR/annotations/annotated-7.pdf"
head -c 8 "$TMP_DIR/annotations/annotated-7.pdf" | grep -q '%PDF-1.'

echo "[verify:ai] AI provider verification completed"
