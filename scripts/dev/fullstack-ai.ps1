$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $RootDir

$env:OCR_PROVIDER = if ($env:OCR_PROVIDER) { $env:OCR_PROVIDER } else { "paddleocr-http" }
$env:OCR_ENDPOINT = if ($env:OCR_ENDPOINT) { $env:OCR_ENDPOINT } else { "http://localhost:5000/api/ai/ocr/paddleocr" }
$env:OCR_REQUIRE_REAL = if ($env:OCR_REQUIRE_REAL) { $env:OCR_REQUIRE_REAL } else { "true" }
$env:OCR_TIMEOUT_SECONDS = if ($env:OCR_TIMEOUT_SECONDS) { $env:OCR_TIMEOUT_SECONDS } else { "180" }
$env:SCORING_PROVIDER = if ($env:SCORING_PROVIDER) { $env:SCORING_PROVIDER } else { "semantic-http" }
$env:SCORING_ENDPOINT = if ($env:SCORING_ENDPOINT) { $env:SCORING_ENDPOINT } else { "http://localhost:5000/api/ai/scoring/semantic" }
$env:SCORING_REQUIRE_REAL = if ($env:SCORING_REQUIRE_REAL) { $env:SCORING_REQUIRE_REAL } else { "false" }
$env:SCORING_TIMEOUT_SECONDS = if ($env:SCORING_TIMEOUT_SECONDS) { $env:SCORING_TIMEOUT_SECONDS } else { "180" }
$env:UPLOAD_OBJECT_ROOT = if ($env:UPLOAD_OBJECT_ROOT) { $env:UPLOAD_OBJECT_ROOT } else { ".data/uploads" }
$env:VITE_API_MODE = if ($env:VITE_API_MODE) { $env:VITE_API_MODE } else { "http" }
$env:VITE_API_BASE_URL = if ($env:VITE_API_BASE_URL) { $env:VITE_API_BASE_URL } else { "http://localhost:8080" }
$env:VITE_API_STRICT_HTTP = if ($env:VITE_API_STRICT_HTTP) { $env:VITE_API_STRICT_HTTP } else { "1" }

Write-Host "[start:stack:ai] OCR provider: $env:OCR_PROVIDER -> $env:OCR_ENDPOINT"
Write-Host "[start:stack:ai] Scoring provider: $env:SCORING_PROVIDER -> $env:SCORING_ENDPOINT"
pnpm start:stack
