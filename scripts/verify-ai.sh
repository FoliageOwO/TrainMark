#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
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

fallback_terms = ("fallback", "deterministic")


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
  grep -q 'PaddleOCR fallback' "$TMP_DIR/paddleocr-result.json"
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
