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
                {"title": "数据库设计合理", "keywords": ["ER图", "表结构", "约束"], "synonyms": ["实体关系", "数据表"]},
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
    parser.add_argument("--evidence-text")
    parser.add_argument("--evidence-file")
    return parser.parse_args()


def load_rubric(rubric_file: str | None) -> dict[str, Any]:
    if not rubric_file:
        return DEFAULT_RUBRIC
    with Path(rubric_file).open("r", encoding="utf-8") as file:
        return json.load(file)


def load_evidence_text(args: argparse.Namespace, rubric: dict[str, Any]) -> str:
    if args.evidence_file:
        return Path(args.evidence_file).read_text(encoding="utf-8")
    if args.evidence_text:
        return args.evidence_text

    file_name = args.file_name or f"自动批改报告-{args.submission_id}.pdf"
    terms = ["登录", "课程", "任务", "提交", "运行截图", "总结"]
    normalized = file_name.lower()
    if "database" in normalized or "数据库" in normalized:
        terms.extend(["ER图", "表结构", "约束", "实体关系"])
    for item in rubric.get("items", []):
        for point in item.get("points") or []:
            keywords = point.get("keywords") or []
            if keywords:
                terms.append(str(keywords[0]))
    return " ".join(dict.fromkeys(terms))


def terms_for_point(point: dict[str, Any]) -> list[str]:
    terms = [str(term) for term in point.get("keywords") or []]
    terms.extend(str(term) for term in point.get("synonyms") or [])
    return [term for term in terms if term]


def score_point(point: dict[str, Any], budget: int, evidence_text: str) -> tuple[int, list[str], int, int]:
    terms = terms_for_point(point)
    if not terms:
        return round(budget * 0.82), [f"{point.get('title', '得分点')}：未配置关键词，按结构完整度保守评分"], 0, 0

    normalized = evidence_text.casefold()
    matched = [term for term in terms if term.casefold() in normalized]
    missing = [term for term in terms if term not in matched]
    ratio = len(matched) / len(terms)
    score = round(budget * (0.45 + 0.55 * ratio))
    evidence = [f"{point.get('title', '得分点')}：命中 {', '.join(matched) if matched else '无'}"]
    if missing:
        evidence.append(f"{point.get('title', '得分点')}：缺失 {', '.join(missing)}")
    return max(0, min(budget, score)), evidence, len(matched), len(terms)


def score_item(item: dict[str, Any], evidence_text: str) -> dict[str, Any]:
    points = item.get("points") or []
    max_score = int(item["score"])
    if not points:
        ai_score = round(max_score * 0.88)
        confidence = 78
        evidence = [f"{item['title']}：未配置细分得分点，按报告结构完整度保守扣分"]
        deduction_reason = "评分项未配置关键词或得分点，系统按结构完整度给出保守初评分。"
    else:
        default_budget = max_score // len(points)
        remaining = max_score
        point_scores: list[int] = []
        evidence = []
        matched_terms = 0
        total_terms = 0
        for index, point in enumerate(points):
            budget = int(point.get("score") or (remaining if index == len(points) - 1 else default_budget))
            remaining -= budget
            point_score, point_evidence, matched_count, total_count = score_point(point, budget, evidence_text)
            point_scores.append(point_score)
            evidence.extend(point_evidence)
            matched_terms += matched_count
            total_terms += total_count
        ai_score = min(max_score, sum(point_scores))
        match_ratio = matched_terms / total_terms if total_terms else 0.82
        confidence = min(96, round(72 + match_ratio * 24))
        deduction_reason = f"关键词/同义词命中 {matched_terms}/{total_terms}，按得分点权重自动扣分。"
    return {
        "rubricItemId": item["id"],
        "title": item["title"],
        "maxScore": max_score,
        "aiScore": ai_score,
        "teacherScore": ai_score,
        "deductionReason": deduction_reason,
        "teacherComment": "请教师复核该分项证据后确认。",
        "confidence": confidence,
        "evidence": evidence,
    }


def main() -> None:
    args = parse_args()
    rubric = load_rubric(args.rubric_file)
    evidence_text = load_evidence_text(args, rubric)
    items = [score_item(item, evidence_text) for item in rubric.get("items", [])]
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
