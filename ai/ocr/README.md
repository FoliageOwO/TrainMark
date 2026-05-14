# OCR Provider

This folder contains the OCR-side provider contract used by TrainMark AI.

The current MVP keeps the backend service self-contained, but this CLI mirrors the
same deterministic local OCR behavior so the backend can later switch from an
in-process provider to a PaddleOCR-backed process without changing the API
surface.

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
