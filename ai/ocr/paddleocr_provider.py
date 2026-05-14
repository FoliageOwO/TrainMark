#!/usr/bin/env python3
"""PaddleOCR-backed OCR provider for TrainMark AI.

The script keeps the TrainMark OCR JSON contract stable. When PaddleOCR or the
input artifact is unavailable in a local MVP environment, it falls back to the
same deterministic extraction shape used by the local provider.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class OcrBlock:
    type: str
    title: str
    page: int
    confidence: int


def infer_blocks(object_key: str) -> list[OcrBlock]:
    normalized = object_key.lower()
    if "database" in normalized or "数据库" in normalized:
        return [
            OcrBlock("heading", "数据库概念结构设计", 1, 95),
            OcrBlock("table", "ER 实体关系表", 3, 92),
            OcrBlock("table", "数据字典", 5, 90),
            OcrBlock("paragraph", "规范化分析", 7, 88),
        ]
    if normalized.endswith((".png", ".jpg", ".jpeg")):
        return [
            OcrBlock("image", "系统截图", 1, 89),
            OcrBlock("paragraph", "截图文字说明", 1, 84),
        ]
    return [
        OcrBlock("heading", "需求分析", 2, 96),
        OcrBlock("table", "数据库表结构", 7, 91),
        OcrBlock("image", "系统运行截图", 12, 88),
        OcrBlock("heading", "实训总结", 17, 90),
    ]


def build_plain_text_preview(blocks: list[OcrBlock], source: str) -> str:
    titles = "、".join(block.title for block in blocks) or "文档内容"
    return f"识别到 {titles} 等结构化内容。来源：{source}。"


def resolve_input_path(args: argparse.Namespace) -> Path:
    candidate = Path(args.normalized_object_key or args.object_key)
    if candidate.exists():
        return candidate
    return Path(args.object_key)


def result_payload(job_id: int, submission_id: int, blocks: list[OcrBlock], source: str) -> dict[str, Any]:
    return {
        "jobId": job_id,
        "submissionId": submission_id,
        "plainText": build_plain_text_preview(blocks, source),
        "blocks": [asdict(block) for block in blocks],
    }


def normalize_result_item(item: Any) -> dict[str, Any]:
    if isinstance(item, dict):
        return item.get("res", item)
    res = getattr(item, "res", None)
    if isinstance(res, dict):
        return res
    json_data = getattr(item, "json", None)
    if isinstance(json_data, dict):
        return json_data.get("res", json_data)
    return {}


def blocks_from_paddle_result(result: Any) -> list[OcrBlock]:
    blocks: list[OcrBlock] = []
    for page_number, item in enumerate(result, start=1):
        data = normalize_result_item(item)
        page = data.get("page_index")
        if isinstance(page, int):
            page_number = page + 1

        texts = data.get("rec_texts")
        scores = data.get("rec_scores")
        if isinstance(texts, list):
            for index, text in enumerate(texts):
                title = str(text).strip()
                if not title:
                    continue
                confidence = score_to_percent(scores[index] if isinstance(scores, list) and index < len(scores) else None)
                blocks.append(OcrBlock("paragraph", title, page_number, confidence))
            continue

        text = data.get("rec_text")
        if isinstance(text, str) and text.strip():
            blocks.append(OcrBlock("paragraph", text.strip(), page_number, score_to_percent(data.get("rec_score"))))
    return blocks


def score_to_percent(score: Any) -> int:
    try:
        value = float(score)
    except (TypeError, ValueError):
        return 90
    if value <= 1:
        value *= 100
    return max(0, min(100, round(value)))


def recognize_with_paddle(input_path: Path, args: argparse.Namespace) -> list[OcrBlock]:
    from paddleocr import PaddleOCR  # type: ignore

    options = {
        "use_doc_orientation_classify": False,
        "use_doc_unwarping": False,
        "use_textline_orientation": False,
        "lang": args.language,
        "engine": args.engine,
    }
    try:
        ocr = PaddleOCR(**options)
    except TypeError:
        options.pop("engine", None)
        ocr = PaddleOCR(**options)

    result = ocr.predict(str(input_path))
    return blocks_from_paddle_result(result)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run PaddleOCR and emit TrainMark OCR JSON.")
    parser.add_argument("--job-id", type=int, required=True)
    parser.add_argument("--submission-id", type=int, required=True)
    parser.add_argument("--object-key", required=True)
    parser.add_argument("--normalized-object-key", default="")
    parser.add_argument("--language", default="ch")
    parser.add_argument("--engine", default="paddle", choices=["paddle", "transformers"])
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_path = resolve_input_path(args)
    blocks: list[OcrBlock]
    source = "PaddleOCR"

    if input_path.exists():
        try:
            blocks = recognize_with_paddle(input_path, args)
        except Exception as error:  # noqa: BLE001 - provider boundary logs and falls back.
            print(f"[paddleocr-provider] PaddleOCR unavailable, using fallback: {error}", file=sys.stderr)
            source = "PaddleOCR fallback"
            blocks = infer_blocks(args.object_key)
    else:
        print(f"[paddleocr-provider] input not found, using fallback: {input_path}", file=sys.stderr)
        source = "PaddleOCR fallback"
        blocks = infer_blocks(args.object_key)

    if not blocks:
        source = "PaddleOCR fallback"
        blocks = infer_blocks(args.object_key)

    print(json.dumps(result_payload(args.job_id, args.submission_id, blocks, source), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
