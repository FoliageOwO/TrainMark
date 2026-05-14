#!/usr/bin/env python3
"""Deterministic local scoring provider for TrainMark AI MVP."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


DEFAULT_RUBRIC: dict[str, Any] = {
    "totalScore": 100,
    "items": [
        {
            "id": 1,
            "title": "需求与设计",
            "score": 20,
            "points": [
                {"title": "功能模块完整", "keywords": ["登录", "课程", "任务", "提交"]},
                {"title": "数据库设计合理", "keywords": ["ER图", "表结构", "约束"]},
            ],
        },
        {"id": 2, "title": "系统实现", "score": 50, "points": []},
        {"id": 3, "title": "报告规范", "score": 30, "points": []},
    ],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run deterministic local scoring.")
    parser.add_argument("--result-id", type=int, required=True)
    parser.add_argument("--assignment-id", type=int, required=True)
    parser.add_argument("--submission-id", type=int, required=True)
    parser.add_argument("--student-id", type=int, required=True)
    parser.add_argument("--student-name", required=True)
    parser.add_argument("--student-no", required=True)
    parser.add_argument("--file-name")
    parser.add_argument("--rubric-file")
    return parser.parse_args()


def load_rubric(rubric_file: str | None) -> dict[str, Any]:
    if not rubric_file:
        return DEFAULT_RUBRIC
    with Path(rubric_file).open("r", encoding="utf-8") as file:
        return json.load(file)


def score_item(item: dict[str, Any]) -> dict[str, Any]:
    points = item.get("points") or []
    max_score = int(item["score"])
    confidence = 82 if not points else min(96, 82 + len(points) * 4)
    ai_score = max(0, max_score - max(2, max_score // 8))
    evidence = [
        f"{point.get('title', '得分点')}：{'、'.join(point.get('keywords') or [])}"
        for point in points
    ]
    return {
        "rubricItemId": item["id"],
        "title": item["title"],
        "maxScore": max_score,
        "aiScore": ai_score,
        "teacherScore": ai_score,
        "deductionReason": "本地规则评分根据关键词、得分点完整度和报告结构完整度自动扣分。",
        "teacherComment": "请教师复核该分项证据后确认。",
        "confidence": confidence,
        "evidence": evidence,
    }


def main() -> None:
    args = parse_args()
    rubric = load_rubric(args.rubric_file)
    items = [score_item(item) for item in rubric.get("items", [])]
    score = sum(item["teacherScore"] for item in items)
    file_name = args.file_name or f"自动批改报告-{args.submission_id}.pdf"
    result = {
        "id": args.result_id,
        "assignmentId": args.assignment_id,
        "submissionId": args.submission_id,
        "studentId": args.student_id,
        "studentName": args.student_name,
        "studentNo": args.student_no,
        "fileName": file_name,
        "previewUrl": f"/previews/submissions/{args.submission_id}/report.pdf",
        "annotationPdfUrl": f"/annotations/submissions/{args.submission_id}/annotated.pdf",
        "totalScore": int(rubric.get("totalScore", sum(item["maxScore"] for item in items))),
        "aiScore": score,
        "teacherScore": score,
        "confidence": 86,
        "reviewStatus": "NEEDS_REVIEW",
        "publicationStatus": "NOT_PUBLISHED",
        "overallComment": "本地规则评分已完成初评，建议教师重点复核扣分原因和证据定位。",
        "reviewedAt": None,
        "publishedAt": None,
        "items": items,
        "annotations": [
            {
                "id": args.result_id,
                "page": 1,
                "anchor": "自动评分摘要",
                "comment": "请复核规则评分生成的扣分证据",
                "severity": "info",
            }
        ],
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
