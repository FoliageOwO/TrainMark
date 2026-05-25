#!/usr/bin/env python3
"""TrainMark AI provider bridge.

This small HTTP server exposes production-style provider endpoints for the Java
services while reusing the existing PaddleOCR and semantic scoring adapters.
It is intentionally thin: provider JSON contracts stay owned by the adapters.
"""

from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "ai" / "ocr"))
sys.path.insert(0, str(ROOT / "ai" / "scoring"))

from paddleocr_provider import (  # type: ignore  # noqa: E402
    configured_upload_root,
    extract_text_document_blocks,
    infer_blocks,
    is_text_document,
    result_payload,
    recognize_with_paddle,
    resolve_object_path,
)
from semantic_provider import (  # type: ignore  # noqa: E402
    SemanticScorer,
    build_result,
)


SCORING_MODEL = os.environ.get("SCORING_MODEL", "BAAI/bge-small-zh-v1.5")
REQUIRE_REAL_AI = os.environ.get("TRAINMARK_REQUIRE_REAL_AI", "0") == "1"
REQUIRE_REAL_OCR = os.environ.get("TRAINMARK_REQUIRE_REAL_OCR", str(int(REQUIRE_REAL_AI))) == "1"
REQUIRE_REAL_SCORING = os.environ.get("TRAINMARK_REQUIRE_REAL_SCORING", str(int(REQUIRE_REAL_AI))) == "1"
OCR_LANGUAGE = os.environ.get("OCR_LANGUAGE", "ch")
OCR_ENGINE = os.environ.get("OCR_ENGINE", "paddle")
API_KEY = os.environ.get("TRAINMARK_AI_API_KEY", "")
os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")
os.environ.setdefault("PADDLE_PDX_ENABLE_MKLDNN_BYDEFAULT", "False")
os.environ.setdefault("FLAGS_use_mkldnn", "false")

_semantic_scorer: SemanticScorer | None = None


def semantic_scorer() -> SemanticScorer:
    global _semantic_scorer
    if _semantic_scorer is None:
        _semantic_scorer = SemanticScorer(SCORING_MODEL, require_real=REQUIRE_REAL_SCORING)
    return _semantic_scorer


class Namespace:
    def __init__(self, **values: Any) -> None:
        self.__dict__.update(values)


class BridgeHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: object) -> None:
        print("[ai-bridge] " + (fmt % args))

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._headers()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.path.split("?")[0] == "/health":
            self._json({
                "status": "UP",
                "requireRealAi": REQUIRE_REAL_AI,
                "requireRealOcr": REQUIRE_REAL_OCR,
                "requireRealScoring": REQUIRE_REAL_SCORING,
                "scoringModel": SCORING_MODEL,
            })
            return
        self._error(404, f"未实现的 AI Provider 路径：{self.path}")

    def do_POST(self) -> None:  # noqa: N802
        if not self._authorized():
            self._error(401, "AI Provider API key 校验失败")
            return

        path = self.path.split("?")[0]
        try:
            if path == "/api/ai/ocr/paddleocr":
                self._json(self._paddleocr(self._body()))
                return
            if path == "/api/ai/scoring/semantic":
                self._json(self._semantic_scoring(self._body()))
                return
        except Exception as error:  # noqa: BLE001 - provider boundary returns JSON errors.
            self._error(500, str(error))
            return
        self._error(404, f"未实现的 AI Provider 路径：{path}")

    def _authorized(self) -> bool:
        if not API_KEY:
            return True
        auth = self.headers.get("Authorization", "")
        return auth == f"Bearer {API_KEY}"

    def _headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")

    def _body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def _json(self, data: Any, status: int = 200) -> None:
        body = json.dumps({"success": True, "data": data, "message": "ok"}, ensure_ascii=False)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._headers()
        self.end_headers()
        self.wfile.write(body.encode("utf-8"))

    def _error(self, status: int, message: str) -> None:
        body = json.dumps({"success": False, "data": None, "message": message}, ensure_ascii=False)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._headers()
        self.end_headers()
        self.wfile.write(body.encode("utf-8"))

    def _paddleocr(self, payload: dict[str, Any]) -> dict[str, Any]:
        job_id = int(payload["jobId"])
        submission_id = int(payload["submissionId"])
        object_key = str(payload.get("objectKey", ""))
        normalized_object_key = str(payload.get("normalizedObjectKey", object_key))
        input_path = resolve_input_path(normalized_object_key, object_key)

        args = Namespace(language=OCR_LANGUAGE, engine=OCR_ENGINE)
        if input_path.exists():
            try:
                if is_text_document(input_path):
                    blocks = extract_text_document_blocks(input_path)
                    source = "文档文本提取"
                else:
                    blocks = recognize_with_paddle(input_path, args)
                    source = "PaddleOCR"
            except Exception as error:  # noqa: BLE001 - provider boundary may fall back in local mode.
                if REQUIRE_REAL_OCR:
                    raise RuntimeError(f"PaddleOCR 必须可用，但当前调用失败：{error}") from error
                print(f"[ai-bridge] PaddleOCR 不可用，使用离线兜底：{error}")
                blocks = infer_blocks(object_key)
                source = "PaddleOCR 离线兜底"
        elif REQUIRE_REAL_OCR:
            raise FileNotFoundError(f"PaddleOCR 输入文件不存在：{input_path}")
        else:
            blocks = infer_blocks(object_key)
            source = "PaddleOCR 离线兜底"

        if not blocks:
            if REQUIRE_REAL_OCR:
                raise RuntimeError("PaddleOCR 没有返回可用文本块")
            blocks = infer_blocks(object_key)
            source = "PaddleOCR 离线兜底"

        return result_payload(job_id, submission_id, blocks, source)

    def _semantic_scoring(self, payload: dict[str, Any]) -> dict[str, Any]:
        rubric = payload.get("rubric") or {"totalScore": 100, "items": []}
        args = Namespace(
            result_id=int(payload["resultId"]),
            assignment_id=int(payload["assignmentId"]),
            submission_id=int(payload["submissionId"]),
            student_id=int(payload["studentId"]),
            student_name=str(payload.get("studentName", "")),
            student_no=str(payload.get("studentNo", "")),
            file_name=str(payload.get("fileName", f"提交报告-{payload['submissionId']}.pdf")),
            keyword_weight=float(payload.get("keywordWeight", 0.35)),
            semantic_weight=float(payload.get("semanticWeight", 0.45)),
            structure_weight=float(payload.get("structureWeight", 0.20)),
        )
        evidence_text = str(payload.get("fileContentText") or payload.get("evidenceText") or "")
        return build_result(args, rubric, semantic_scorer(), evidence_text)


def resolve_input_path(normalized_object_key: str, object_key: str) -> Path:
    return resolve_object_path(normalized_object_key, object_key)


def main() -> None:
    port = int(os.environ.get("BRIDGE_PORT", "5000"))
    print(f"[ai-bridge] Python: {sys.executable}")
    print(f"[ai-bridge] uploadRoot={configured_upload_root()}")
    if REQUIRE_REAL_SCORING:
        print("[ai-bridge] 严格真实 AI 模式：正在加载语义评分模型")
        semantic_scorer()
    server = HTTPServer(("0.0.0.0", port), BridgeHandler)
    print(f"[ai-bridge] AI Provider bridge started: http://localhost:{port}")
    print(
        "[ai-bridge] "
        f"requireRealAi={REQUIRE_REAL_AI} "
        f"requireRealOcr={REQUIRE_REAL_OCR} "
        f"requireRealScoring={REQUIRE_REAL_SCORING} "
        f"scoringModel={SCORING_MODEL}"
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[ai-bridge] stopped")
        server.shutdown()


if __name__ == "__main__":
    main()
