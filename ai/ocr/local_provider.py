#!/usr/bin/env python3
"""Deterministic local OCR provider for TrainMark AI MVP."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass


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


def build_plain_text_preview(blocks: list[OcrBlock]) -> str:
    titles = "、".join(block.title for block in blocks) or "文档内容"
    return f"识别到 {titles} 等结构化内容。"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run deterministic local OCR.")
    parser.add_argument("--job-id", type=int, required=True)
    parser.add_argument("--submission-id", type=int, required=True)
    parser.add_argument("--object-key", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    blocks = infer_blocks(args.object_key)
    result = {
        "jobId": args.job_id,
        "submissionId": args.submission_id,
        "plainText": build_plain_text_preview(blocks),
        "blocks": [asdict(block) for block in blocks],
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
