# OCR Provider

This folder contains the OCR-side provider contract used by TrainMark AI.

The current MVP keeps the backend service self-contained, but this CLI mirrors
the same deterministic local OCR behavior so the backend can later switch from
an in-process provider to a PaddleOCR-backed process without changing the API
surface. OCR jobs now run after the document preprocessing contract in
`ai/document/`, which normalizes PDF, Word and image submissions into OCR-ready
metadata.

## Local Provider

```bash
python3 ai/ocr/local_provider.py \
  --job-id 1001 \
  --submission-id 1 \
  --object-key assignments/1/students/2/database-report.pdf
```

The command writes an `OcrResultSummary`-compatible JSON document to stdout:

```json
{
  "jobId": 1001,
  "submissionId": 1,
  "plainText": "识别到 ... 等结构化内容。",
  "blocks": [
    { "type": "heading", "title": "数据库概念结构设计", "page": 1, "confidence": 95 }
  ]
}
```

## PaddleOCR Migration Notes

Use `paddleocr.example.yml` as the first production configuration shape. The
PaddleOCR implementation should keep stdout compatible with the local provider
JSON contract and write operational logs to stderr.

`paddleocr_provider.py` is the first PaddleOCR-backed adapter. It follows the
PaddleOCR 3.x Python `PaddleOCR(...).predict(...)` shape and emits the same
`OcrResultSummary` JSON used by the backend. In local MVP environments where
PaddleOCR is not installed or the normalized input artifact is not present, it
falls back to deterministic blocks and marks the plain-text source as
`PaddleOCR fallback`.

```bash
python3 ai/ocr/paddleocr_provider.py \
  --job-id 1002 \
  --submission-id 2 \
  --object-key assignments/1/students/3/screenshot.png \
  --normalized-object-key converted/assignments/1/students/3/screenshot.png
```

## Backend Command Provider

`ocr-service` defaults to the in-process local provider. To call an external OCR
CLI, start the service with:

```bash
OCR_PROVIDER=command \
OCR_COMMAND='python3 ai/ocr/local_provider.py --job-id {jobId} --submission-id {submissionId} --object-key {objectKey}' \
pnpm dev:backend:ocr
```

The placeholders `{jobId}`, `{submissionId}` and `{objectKey}` are replaced by
the backend before the command is executed.

To use the built-in PaddleOCR adapter, set `OCR_PROVIDER=paddleocr`. The backend
will call:

```bash
python3 ai/ocr/paddleocr_provider.py \
  --job-id {jobId} \
  --submission-id {submissionId} \
  --object-key {objectKey} \
  --normalized-object-key {normalizedObjectKey}
```

You can still override the full command with `OCR_COMMAND` when production
deployment needs a different Python environment, model path or wrapper script.
