#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cd "$ROOT_DIR"

require_no_ai_fallback() {
  local label="$1"
  local json_file="$2"
  if [[ "${TRAINMARK_REQUIRE_REAL_AI:-0}" != "1" ]]; then
    return 0
  fi
  python3 - "$label" "$json_file" <<'PY'
import json
import sys

label = sys.argv[1]
path = sys.argv[2]

with open(path, "r", encoding="utf-8") as file:
    payload = json.load(file)

fallback_terms = (
    "fallback",
    "回退",
    "deterministic",
    "确定性",
)


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

echo "[verify:ai] Python syntax"
python3 -m py_compile \
  ai/document/local_converter.py \
  ai/ocr/local_provider.py \
  ai/ocr/paddleocr_provider.py \
  ai/scoring/local_provider.py \
  ai/scoring/semantic_provider.py \
  ai/annotation/local_provider.py

echo "[verify:ai] Document preprocessing"
python3 ai/document/local_converter.py \
  --submission-id 1 \
  --object-key assignments/1/students/2/database-report.docx > "$TMP_DIR/document-docx.json"
python3 -m json.tool "$TMP_DIR/document-docx.json" >/dev/null
grep -q '"sourceFormat": "WORD"' "$TMP_DIR/document-docx.json"
grep -q '"targetFormat": "PDF"' "$TMP_DIR/document-docx.json"
grep -q '"normalizedObjectKey": "converted/assignments/1/students/2/database-report.pdf"' "$TMP_DIR/document-docx.json"
python3 ai/document/local_converter.py \
  --submission-id 2 \
  --object-key assignments/1/students/3/screenshot.png > "$TMP_DIR/document-image.json"
python3 -m json.tool "$TMP_DIR/document-image.json" >/dev/null
grep -q '"sourceFormat": "IMAGE"' "$TMP_DIR/document-image.json"
grep -q '"targetFormat": "IMAGE"' "$TMP_DIR/document-image.json"

echo "[verify:ai] OCR provider"
python3 ai/ocr/local_provider.py \
  --job-id 1001 \
  --submission-id 1 \
  --object-key assignments/1/students/2/database-report.pdf > "$TMP_DIR/ocr-result.json"
python3 -m json.tool "$TMP_DIR/ocr-result.json" >/dev/null
python3 ai/ocr/paddleocr_provider.py \
  --job-id 1002 \
  --submission-id 2 \
  --object-key assignments/1/students/3/screenshot.png \
  --normalized-object-key converted/assignments/1/students/3/screenshot.png > "$TMP_DIR/paddleocr-result.json"
python3 -m json.tool "$TMP_DIR/paddleocr-result.json" >/dev/null
if [[ "${TRAINMARK_REQUIRE_REAL_AI:-0}" == "1" ]]; then
  require_no_ai_fallback "PaddleOCR provider" "$TMP_DIR/paddleocr-result.json"
else
  grep -q 'PaddleOCR fallback' "$TMP_DIR/paddleocr-result.json"
fi

echo "[verify:ai] Scoring provider"
python3 ai/scoring/local_provider.py \
  --result-id 2001 \
  --assignment-id 1 \
  --submission-id 7 \
  --student-id 2 \
  --student-name 张三 \
  --student-no 2024010101 \
  --file-name database-report.pdf \
  --rubric-file ai/scoring/sample-rubric.json > "$TMP_DIR/grading-result.json"
python3 -m json.tool "$TMP_DIR/grading-result.json" >/dev/null
grep -q '关键词/同义词命中' "$TMP_DIR/grading-result.json"
grep -q '数据库设计合理：命中' "$TMP_DIR/grading-result.json"
python3 ai/scoring/semantic_provider.py \
  --result-id 2002 \
  --assignment-id 1 \
  --submission-id 8 \
  --student-id 3 \
  --student-name 李四 \
  --student-no 2024010102 \
  --file-name database-report.pdf \
  --rubric-file ai/scoring/sample-rubric.json > "$TMP_DIR/semantic-grading-result.json"
python3 -m json.tool "$TMP_DIR/semantic-grading-result.json" >/dev/null
grep -q '语义评分已完成初评' "$TMP_DIR/semantic-grading-result.json"
grep -q '语义相似度' "$TMP_DIR/semantic-grading-result.json"
require_no_ai_fallback "Semantic scoring provider" "$TMP_DIR/semantic-grading-result.json"

echo "[verify:ai] Annotation provider"
python3 ai/annotation/local_provider.py \
  --result-id 3001 \
  --submission-id 7 \
  --student-name 张三 \
  --output-dir "$TMP_DIR/annotations" > "$TMP_DIR/annotation-result.json"
python3 -m json.tool "$TMP_DIR/annotation-result.json" >/dev/null
test -s "$TMP_DIR/annotations/annotated-7.pdf"
head -c 8 "$TMP_DIR/annotations/annotated-7.pdf" | grep -q '%PDF-1.'

echo "[verify:ai] AI provider verification completed"
