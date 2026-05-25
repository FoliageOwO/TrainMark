# OCR Provider

这里维护 TrainMark AI 的 OCR provider 契约。后端可以使用本地内置 provider、命令行 provider，或通过 HTTP 调用独立 AI bridge。

## 本地 Provider

```bash
python ai/ocr/local_provider.py \
  --job-id 1001 \
  --submission-id 1 \
  --object-key assignments/1/students/2/database-report.pdf
```

命令会输出兼容 `OcrResultSummary` 的 JSON：

```json
{
  "jobId": 1001,
  "submissionId": 1,
  "plainText": "识别到 ... 等结构化内容。来源：本地 OCR。",
  "blocks": [
    { "type": "heading", "title": "数据库概念结构设计", "page": 1, "confidence": 95 }
  ]
}
```

## 真实 PaddleOCR Provider

`paddleocr_provider.py` 保持同一份 JSON 契约：

- 图片文件（`.png`、`.jpg`、`.jpeg`）调用真实 PaddleOCR。
- 文本型 Word/PDF 文件优先做真实文本提取。
- 传入对象 key 时会自动从 `UPLOAD_OBJECT_ROOT` 查找上传文件，默认 `.data/uploads`。
- 加 `--require-real` 后，PaddleOCR 不可用、文件不存在或没有识别文本都会直接失败。

第一次使用建议创建项目内独立虚拟环境：

```powershell
uv python install 3.12
uv venv --python 3.12 .venv-ai
uv pip install --python .\.venv-ai\Scripts\python.exe -r ai\requirements.txt
```

严格验证真实 OCR：

```powershell
$env:OCR_ENABLE_MKLDNN="false"
$env:PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK="True"
.\.venv-ai\Scripts\python.exe ai\ocr\paddleocr_provider.py `
  --job-id 1002 `
  --submission-id 2 `
  --object-key tmp\ocr-real-test-cn.png `
  --normalized-object-key tmp\ocr-real-test-cn.png `
  --require-real
```

## HTTP Provider

生产部署可以把 PaddleOCR 做成独立 HTTP 服务，同时保留现有 provider JSON 契约。项目内置的开发 bridge 可以这样启动：

```powershell
pnpm start:ai
```

后端使用 HTTP provider：

```powershell
$env:OCR_PROVIDER="paddleocr-http"
$env:OCR_ENDPOINT="http://localhost:5000/api/ai/ocr/paddleocr"
$env:OCR_REQUIRE_REAL="true"
pnpm start:service:ocr
```

或者直接启动完整本地栈：

```powershell
pnpm start:stack:ai
```

如果 bridge 配置了 `TRAINMARK_AI_API_KEY`，后端也要把同一个值配置到 `OCR_API_KEY`，请求时会通过 `Authorization: Bearer <key>` 发送。
