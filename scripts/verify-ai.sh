#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cd "$ROOT_DIR"

echo "[verify:ai] Python syntax"
python3 -m py_compile \
  ai/document/local_converter.py \
  ai/ocr/local_provider.py \
  ai/scoring/local_provider.py \
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
