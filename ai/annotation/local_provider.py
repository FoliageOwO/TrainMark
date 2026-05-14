#!/usr/bin/env python3
"""Deterministic local PDF annotation provider for TrainMark AI MVP."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a deterministic annotated PDF placeholder.")
    parser.add_argument("--result-id", type=int, required=True)
    parser.add_argument("--submission-id", type=int, required=True)
    parser.add_argument("--student-name", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--comment", default="请复核规则评分生成的扣分证据。")
    return parser.parse_args()


def pdf_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_pdf_bytes(lines: list[str]) -> bytes:
    escaped_lines = [pdf_escape(line) for line in lines]
    content_lines = ["BT", "/F1 18 Tf", "72 760 Td"]
    for index, line in enumerate(escaped_lines):
        if index:
            content_lines.append("0 -28 Td")
        content_lines.append(f"({line}) Tj")
    content_lines.append("ET")
    stream = "\n".join(content_lines).encode("utf-8")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream",
    ]

    output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode("ascii"))
        output.extend(obj)
        output.extend(b"\nendobj\n")

    xref_offset = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    output.extend(
        (
            "trailer\n"
            f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            "startxref\n"
            f"{xref_offset}\n"
            "%%EOF\n"
        ).encode("ascii")
    )
    return bytes(output)


def main() -> None:
    args = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = output_dir / f"annotated-{args.submission_id}.pdf"
    lines = [
        "TrainMark AI Annotated Report",
        f"Result ID: {args.result_id}",
        f"Submission ID: {args.submission_id}",
        f"Student: {args.student_name}",
        f"Comment: {args.comment}",
    ]
    pdf_path.write_bytes(build_pdf_bytes(lines))
    result = {
        "resultId": args.result_id,
        "submissionId": args.submission_id,
        "annotationPdfPath": str(pdf_path),
        "annotationPdfUrl": f"/annotations/submissions/{args.submission_id}/annotated.pdf",
        "pageCount": 1,
        "annotations": [
            {
                "page": 1,
                "anchor": "自动评分摘要",
                "comment": args.comment,
                "severity": "info",
            }
        ],
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
