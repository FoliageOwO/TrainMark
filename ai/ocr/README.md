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
`PaddleOCR 离线兜底`.

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

Set `OCR_REQUIRE_REAL=true` when the built-in adapter must fail instead of
falling back. The backend appends `--require-real` to the default PaddleOCR
command in that mode. If you override `OCR_COMMAND`, include `--require-real`
in your custom command when the same production gate is required.

You can still override the full command with `OCR_COMMAND` when production
deployment needs a different Python environment, model path or wrapper script.

## HTTP Provider

生产部署可以把 PaddleOCR 做成独立 HTTP 服务，同时保留现有 provider JSON 契约。
后端会把提交信息和文档预处理元数据发送到 `OCR_ENDPOINT`，并接受两种返回：
原始 `OcrResultSummary` JSON，或 `{ "success": true, "data": ... }` 包装格式。

```bash
# 1. 启动项目内置桥接服务；生产环境也可以替换成自己的 PaddleOCR 服务。
python3 ai/bridge_server.py

# 2. 使用 HTTP provider 启动 ocr-service。
OCR_PROVIDER=paddleocr-http \
OCR_ENDPOINT=http://localhost:5000/api/ai/ocr/paddleocr \
OCR_REQUIRE_REAL=true \
pnpm dev:backend:ocr
```

如果桥接服务配置了 `TRAINMARK_AI_API_KEY`，后端也要把同一个值配置到
`OCR_API_KEY`，请求时会通过 `Authorization: Bearer <key>` 发送。
