#!/usr/bin/env python3
"""Deterministic local document preprocessing contract for TrainMark AI MVP."""

from __future__ import annotations

import argparse
import json
from pathlib import PurePosixPath


def source_format(object_key: str) -> str:
    suffix = PurePosixPath(object_key).suffix.lower()
    if suffix == ".pdf":
        return "PDF"
    if suffix in {".doc", ".docx"}:
        return "WORD"
    if suffix in {".png", ".jpg", ".jpeg"}:
        return "IMAGE"
    return "UNKNOWN"


def normalized_object_key(object_key: str, detected_format: str) -> str:
    if detected_format in {"PDF", "IMAGE"}:
        return object_key
    stem = object_key.rsplit(".", 1)[0] if "." in object_key else object_key
    return f"converted/{stem}.pdf"


def inferred_page_count(object_key: str, detected_format: str) -> int:
    normalized = object_key.lower()
    if detected_format == "IMAGE":
        return 1
    if "database" in normalized or "数据库" in normalized:
        return 8
    if detected_format == "WORD":
        return 12
    return 18


def inferred_image_count(object_key: str, detected_format: str) -> int:
    normalized = object_key.lower()
    if detected_format == "IMAGE":
        return 1
    if "screenshot" in normalized or "截图" in normalized:
        return 4
    return 2


def inferred_table_hint_count(object_key: str) -> int:
    normalized = object_key.lower()
    return 3 if "database" in normalized or "数据库" in normalized else 1


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run deterministic local document preprocessing.")
    parser.add_argument("--submission-id", type=int, required=True)
    parser.add_argument("--object-key", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    detected_format = source_format(args.object_key)
    result = {
        "submissionId": args.submission_id,
        "sourceObjectKey": args.object_key,
        "normalizedObjectKey": normalized_object_key(args.object_key, detected_format),
        "sourceFormat": detected_format,
        "targetFormat": "IMAGE" if detected_format == "IMAGE" else "PDF",
        "pageCount": inferred_page_count(args.object_key, detected_format),
        "imageCount": inferred_image_count(args.object_key, detected_format),
        "tableHintCount": inferred_table_hint_count(args.object_key),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
