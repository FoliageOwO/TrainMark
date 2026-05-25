$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$PythonBin = Join-Path $RootDir ".venv-ai\Scripts\python.exe"

if (-not (Test-Path $PythonBin)) {
  Write-Error "未找到 .venv-ai。请先在项目根目录执行：uv venv --python 3.12 .venv-ai"
}

$env:PYTHONIOENCODING = "utf-8"
$env:BRIDGE_PORT = if ($env:BRIDGE_PORT) { $env:BRIDGE_PORT } else { "5000" }
$env:UPLOAD_OBJECT_ROOT = if ($env:UPLOAD_OBJECT_ROOT) { $env:UPLOAD_OBJECT_ROOT } else { ".data/uploads" }
$env:TRAINMARK_REQUIRE_REAL_OCR = if ($env:TRAINMARK_REQUIRE_REAL_OCR) { $env:TRAINMARK_REQUIRE_REAL_OCR } else { "1" }
$env:TRAINMARK_REQUIRE_REAL_SCORING = if ($env:TRAINMARK_REQUIRE_REAL_SCORING) { $env:TRAINMARK_REQUIRE_REAL_SCORING } else { "0" }
$env:OCR_LANGUAGE = if ($env:OCR_LANGUAGE) { $env:OCR_LANGUAGE } else { "ch" }
$env:OCR_DEVICE = if ($env:OCR_DEVICE) { $env:OCR_DEVICE } else { "cpu" }
$env:OCR_ENABLE_MKLDNN = if ($env:OCR_ENABLE_MKLDNN) { $env:OCR_ENABLE_MKLDNN } else { "false" }
$env:OCR_CPU_THREADS = if ($env:OCR_CPU_THREADS) { $env:OCR_CPU_THREADS } else { "4" }
$env:PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK = if ($env:PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK) { $env:PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK } else { "True" }
$env:PADDLE_PDX_ENABLE_MKLDNN_BYDEFAULT = if ($env:PADDLE_PDX_ENABLE_MKLDNN_BYDEFAULT) { $env:PADDLE_PDX_ENABLE_MKLDNN_BYDEFAULT } else { "False" }
$env:FLAGS_use_mkldnn = if ($env:FLAGS_use_mkldnn) { $env:FLAGS_use_mkldnn } else { "false" }

Set-Location $RootDir
Write-Host "[ai-bridge] Python: $PythonBin"
Write-Host "[ai-bridge] real OCR: $env:TRAINMARK_REQUIRE_REAL_OCR; real scoring: $env:TRAINMARK_REQUIRE_REAL_SCORING"
& $PythonBin ai\bridge_server.py
