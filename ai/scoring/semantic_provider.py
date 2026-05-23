#!/usr/bin/env python3
"""Semantic scoring provider for TrainMark AI.

This provider uses SentenceTransformers when it is installed locally and falls
back to deterministic lexical similarity when the model runtime is unavailable
unless --require-real is set.
It emits the same GradingResultSummary-compatible JSON as the local provider.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
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
                {"title": "功能模块完整", "score": 10, "keywords": ["登录", "课程", "任务", "提交"]},
                {"title": "数据库设计合理", "score": 10, "keywords": ["ER图", "表结构", "约束"], "synonyms": ["实体关系", "数据表"]},
            ],
        },
        {"id": 2, "title": "系统实现", "score": 50, "points": []},
        {"id": 3, "title": "报告规范", "score": 30, "points": []},
    ],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run semantic scoring.")
    parser.add_argument("--result-id", type=int, required=True)
    parser.add_argument("--assignment-id", type=int, required=True)
    parser.add_argument("--submission-id", type=int, required=True)
    parser.add_argument("--student-id", type=int, required=True)
    parser.add_argument("--student-name", required=True)
    parser.add_argument("--student-no", required=True)
    parser.add_argument("--file-name")
    parser.add_argument("--rubric-file")
    parser.add_argument("--rubric-json")
    parser.add_argument("--evidence-text")
    parser.add_argument("--evidence-file")
    parser.add_argument("--model", default="BAAI/bge-small-zh-v1.5")
    parser.add_argument("--keyword-weight", type=float, default=0.35)
    parser.add_argument("--semantic-weight", type=float, default=0.45)
    parser.add_argument("--structure-weight", type=float, default=0.20)
    parser.add_argument("--require-real", action="store_true", help="语义模型不可用时直接失败，不使用关键词兜底")
    return parser.parse_args()


def load_rubric(args: argparse.Namespace) -> dict[str, Any]:
    if args.rubric_json:
        return json.loads(args.rubric_json)
    if args.rubric_file:
        with Path(args.rubric_file).open("r", encoding="utf-8") as file:
            return json.load(file)
    return DEFAULT_RUBRIC


def load_evidence_text(args: argparse.Namespace, rubric: dict[str, Any]) -> str:
    if args.evidence_file:
        return Path(args.evidence_file).read_text(encoding="utf-8")
    if args.evidence_text:
        return args.evidence_text

    file_name = args.file_name or f"自动批改报告-{args.submission_id}.pdf"
    terms = ["登录", "课程", "任务", "提交", "运行截图", "总结", "功能实现", "异常处理"]
    normalized = file_name.lower()
    if "database" in normalized or "数据库" in normalized:
        terms.extend(["ER图", "表结构", "约束", "实体关系", "数据字典"])
    for item in rubric.get("items", []):
        for point in item.get("points") or []:
            terms.append(str(point.get("title", "")))
            terms.extend(str(term) for term in point.get("keywords") or [])
            terms.extend(str(term) for term in point.get("synonyms") or [])
    return " ".join(term for term in dict.fromkeys(terms) if term)


def normalize_weights(args: argparse.Namespace) -> tuple[float, float, float]:
    total = args.keyword_weight + args.semantic_weight + args.structure_weight
    if total <= 0:
        return 0.35, 0.45, 0.20
    return args.keyword_weight / total, args.semantic_weight / total, args.structure_weight / total


def has_meaningful_evidence(evidence_text: str) -> bool:
    compact = re.sub(r"\s+", "", evidence_text)
    if len(compact) >= 20:
        return True
    return len(tokenize(evidence_text)) >= 3


def structure_ratio(evidence_text: str) -> float:
    compact_length = len(re.sub(r"\s+", "", evidence_text))
    if compact_length == 0:
        return 0.0
    if compact_length < 20:
        return 0.12
    if compact_length < 80:
        return 0.35
    if compact_length < 300:
        return 0.62
    return 0.82


def point_terms(point: dict[str, Any]) -> list[str]:
    terms = [str(point.get("title", ""))]
    terms.extend(str(term) for term in point.get("keywords") or [])
    terms.extend(str(term) for term in point.get("synonyms") or [])
    return [term for term in terms if term]


def keyword_ratio(terms: list[str], evidence_text: str) -> tuple[float, list[str], list[str]]:
    searchable = evidence_text.casefold()
    match_terms = [term for term in terms if term.casefold() in searchable]
    miss_terms = [term for term in terms if term not in match_terms]
    if not terms:
        return 0.82, [], []
    return len(match_terms) / len(terms), match_terms, miss_terms


def deterministic_similarity(left: str, right: str) -> float:
    left_tokens = tokenize(left)
    right_tokens = tokenize(right)
    if not left_tokens or not right_tokens:
        return 0.0
    intersection = len(left_tokens & right_tokens)
    union = len(left_tokens | right_tokens)
    jaccard = intersection / union if union else 0.0
    containment = intersection / min(len(left_tokens), len(right_tokens))
    return max(0.0, min(1.0, 0.45 * jaccard + 0.55 * containment))


def tokenize(value: str) -> set[str]:
    lowered = value.casefold()
    tokens = set(re.findall(r"[a-z0-9_]+", lowered))
    tokens.update(re.findall(r"[\u4e00-\u9fff]{2,}", lowered))
    return tokens


class SemanticScorer:
    def __init__(self, model_name: str, require_real: bool) -> None:
        self.source = "语义关键词兜底"
        self.model = None
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore

            self.model = SentenceTransformer(model_name)
            self.source = "SentenceTransformers 语义模型"
        except Exception as error:  # noqa: BLE001 - model runtime is optional.
            if require_real:
                raise RuntimeError(f"SentenceTransformers 语义模型必须可用，但当前加载失败：{error}") from error
            print(f"[semantic-provider] SentenceTransformers 不可用，使用语义关键词兜底：{error}", file=sys.stderr)

    def similarity(self, evidence_text: str, expected_text: str) -> float:
        if self.model is None:
            return deterministic_similarity(evidence_text, expected_text)
        embeddings = self.model.encode([evidence_text, expected_text], normalize_embeddings=True)
        left = embeddings[0]
        right = embeddings[1]
        score = sum(float(a) * float(b) for a, b in zip(left, right))
        return max(0.0, min(1.0, score))


def score_point(
    point: dict[str, Any],
    budget: int,
    evidence_text: str,
    scorer: SemanticScorer,
    weights: tuple[float, float, float],
) -> tuple[int, list[str], int, int, float]:
    if not has_meaningful_evidence(evidence_text):
        title = point.get("title", "得分点")
        return 0, [f"{title}：未检测到可用于评分的报告正文或 OCR 文本"], 0, len(point_terms(point)), 0.0

    terms = point_terms(point)
    ratio, matched, missing = keyword_ratio(terms, evidence_text)
    expected_text = " ".join(terms) or str(point.get("title", "得分点"))
    semantic_score = scorer.similarity(evidence_text, expected_text)
    structure_score = structure_ratio(evidence_text)
    combined = weights[0] * ratio + weights[1] * semantic_score + weights[2] * structure_score
    point_score = round(budget * combined)
    evidence = [
        f"{point.get('title', '得分点')}：关键词命中 {', '.join(matched) if matched else '无'}",
        f"{point.get('title', '得分点')}：语义相似度 {round(semantic_score * 100)}%",
    ]
    if missing:
        evidence.append(f"{point.get('title', '得分点')}：缺失 {', '.join(missing)}")
    return max(0, min(budget, point_score)), evidence, len(matched), len(terms), semantic_score


def score_item(
    item: dict[str, Any],
    evidence_text: str,
    scorer: SemanticScorer,
    weights: tuple[float, float, float],
) -> dict[str, Any]:
    points = item.get("points") or []
    max_score = int(item["score"])
    if not points:
        if not has_meaningful_evidence(evidence_text):
            return {
                "rubricItemId": item["id"],
                "title": item["title"],
                "maxScore": max_score,
                "aiScore": 0,
                "teacherScore": 0,
                "deductionReason": "未检测到可用于评分的报告正文或 OCR 文本，该评分项暂不给分。",
                "teacherComment": "请教师确认学生是否提交了有效报告内容。",
                "confidence": 35,
                "evidence": [f"{item['title']}：无可用正文证据"],
            }
        semantic_score = scorer.similarity(evidence_text, str(item["title"]))
        ai_score = round(max_score * (0.30 + 0.55 * semantic_score + 0.15 * structure_ratio(evidence_text)))
        return {
            "rubricItemId": item["id"],
            "title": item["title"],
            "maxScore": max_score,
            "aiScore": ai_score,
            "teacherScore": ai_score,
            "deductionReason": f"未配置细分得分点，按结构完整度和语义相似度 {round(semantic_score * 100)}% 保守评分。",
            "teacherComment": "请教师复核语义评分证据后确认。",
            "confidence": min(92, round(74 + semantic_score * 18)),
            "evidence": [f"{item['title']}：语义相似度 {round(semantic_score * 100)}%"],
        }

    default_budget = math.floor(max_score / len(points))
    remaining = max_score
    point_scores: list[int] = []
    evidence: list[str] = []
    matched_terms = 0
    total_terms = 0
    semantic_scores: list[float] = []
    for index, point in enumerate(points):
        budget = int(point.get("score") or (remaining if index == len(points) - 1 else default_budget))
        remaining -= budget
        point_score, point_evidence, matched_count, total_count, semantic_score = score_point(
            point,
            budget,
            evidence_text,
            scorer,
            weights,
        )
        point_scores.append(point_score)
        evidence.extend(point_evidence)
        matched_terms += matched_count
        total_terms += total_count
        semantic_scores.append(semantic_score)

    ai_score = min(max_score, sum(point_scores))
    avg_semantic = sum(semantic_scores) / len(semantic_scores) if semantic_scores else 0.82
    evidence_available = has_meaningful_evidence(evidence_text)
    confidence = (
        min(96, round(70 + avg_semantic * 18 + (matched_terms / total_terms if total_terms else 0.82) * 8))
        if evidence_available
        else 35
    )
    return {
        "rubricItemId": item["id"],
        "title": item["title"],
        "maxScore": max_score,
        "aiScore": ai_score,
        "teacherScore": ai_score,
        "deductionReason": f"关键词命中 {matched_terms}/{total_terms}，平均语义相似度 {round(avg_semantic * 100)}%，按权重自动扣分。",
        "teacherComment": "请教师复核语义评分证据后确认。",
        "confidence": confidence,
        "evidence": evidence,
    }


def build_result(args: argparse.Namespace, rubric: dict[str, Any], scorer: SemanticScorer, evidence_text: str) -> dict[str, Any]:
    weights = normalize_weights(args)
    items = [score_item(item, evidence_text, scorer, weights) for item in rubric.get("items", [])]
    score = sum(item["teacherScore"] for item in items)
    file_name = args.file_name or f"自动批改报告-{args.submission_id}.pdf"
    evidence_available = has_meaningful_evidence(evidence_text)
    confidence = min(94, round(sum(item["confidence"] for item in items) / len(items))) if items else 30
    overall_comment = (
        f"语义评分已完成初评，评分来源：{scorer.source}。建议教师复核低置信度分项。"
        if evidence_available
        else "未检测到可用于评分的报告正文或 OCR 文本，本次 AI 初评不给分，请教师确认学生提交内容。"
    )
    return {
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
        "confidence": confidence,
        "reviewStatus": "NEEDS_REVIEW",
        "publicationStatus": "NOT_PUBLISHED",
        "overallComment": overall_comment,
        "reviewedAt": None,
        "publishedAt": None,
        "items": items,
        "annotations": [
            {
                "id": args.result_id,
                "page": 1,
                "anchor": "语义评分摘要",
                "comment": f"评分来源：{scorer.source}",
                "severity": "info",
            }
        ],
    }


def main() -> None:
    args = parse_args()
    rubric = load_rubric(args)
    evidence_text = load_evidence_text(args, rubric)
    scorer = SemanticScorer(args.model, args.require_real)
    print(json.dumps(build_result(args, rubric, scorer, evidence_text), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
