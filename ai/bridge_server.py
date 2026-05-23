#!/usr/bin/env python3
"""TrainMark AI 桥接服务器 —— 为前端提供真实 PaddleOCR + 语义评分"""

import json
import os
import sys
import time
import uuid
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler

# 添加当前目录到路径，以便导入 semantic_provider
sys.path.insert(0, str(Path(__file__).parent / "scoring"))

# ---------- 内存存储 ----------
storage: dict = {
    "ocr_jobs": [],
    "ocr_next_id": 1,
    "rubrics": [],
    "rubric_next_id": 1,
    "grading_jobs": [],
    "grading_job_next_id": 1,
    "grading_results": [],
    "grading_result_next_id": 1,
    "assignments": [],
    "assignment_next_id": 1,
    "courses": [],
    "course_next_id": 1,
    "submissions": [],
    "submission_next_id": 1,
}

# ---------- PaddleOCR ----------
_ocr_instance = None

def get_ocr():
    global _ocr_instance
    if _ocr_instance is None:
        try:
            from paddleocr import PaddleOCR
            _ocr_instance = PaddleOCR(lang="ch")
            print("[bridge] PaddleOCR 已加载")
        except Exception as e:
            print(f"[bridge] PaddleOCR 加载失败: {e}")
            _ocr_instance = None
    return _ocr_instance

# ---------- Semantic Scorer ----------
_semantic_scorer = None

def get_scorer():
    global _semantic_scorer
    if _semantic_scorer is None:
        sys.argv = ["scoring", "--result-id", "0", "--assignment-id", "0",
                    "--submission-id", "0", "--student-id", "0",
                    "--student-name", "", "--student-no", ""]
        from semantic_provider import SemanticScorer
        _semantic_scorer = SemanticScorer(
            "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
            require_real=False,
        )
        print(f"[bridge] 语义评分器已加载: {_semantic_scorer.source}")
    return _semantic_scorer

# ---------- 种子数据 ----------
def seed_data():
    if not storage["courses"]:
        storage["courses"].append({
            "id": 1, "name": "Java Web 综合实训", "code": "CS301",
            "semester": "2025-2026-2", "status": "ACTIVE",
            "classCount": 2, "studentCount": 96,
        })
        storage["course_next_id"] = 2
    if not storage["assignments"]:
        storage["assignments"].append({
            "id": 1, "courseId": 1, "title": "Java Web 综合实训报告",
            "deadline": "2026-06-15T23:59:00", "totalScore": 100,
            "status": "PUBLISHED", "description": "完成 Web 系统并撰写报告",
            "similarityCheckEnabled": True, "aiGradingEnabled": True,
        })
        storage["assignment_next_id"] = 2
    if not storage["rubrics"]:
        storage["rubrics"].append({
            "id": 1, "assignmentId": 1, "name": "默认评分标准", "totalScore": 100,
            "items": [
                {"id": 1, "title": "需求与设计", "score": 20, "courseOutcomeCode": "CO1",
                 "points": [
                     {"id": 1, "title": "功能模块完整", "description": "", "score": 10,
                      "keywords": ["登录", "课程", "任务", "提交"], "synonyms": []},
                     {"id": 2, "title": "数据库设计合理", "description": "", "score": 10,
                      "keywords": ["ER图", "表结构", "约束"], "synonyms": ["实体关系", "数据表"]},
                 ]},
                {"id": 2, "title": "系统实现", "score": 50, "courseOutcomeCode": "CO2", "points": []},
                {"id": 3, "title": "报告规范", "score": 30, "courseOutcomeCode": "CO3", "points": []},
            ],
        })
        storage["rubric_next_id"] = 2

# ---------- HTTP 请求处理 ----------
class BridgeHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[bridge] {args[0]}")

    def _send_json(self, data, status=200):
        body = json.dumps({"success": True, "data": data, "message": "ok"}, ensure_ascii=False)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        self.end_headers()
        self.wfile.write(body.encode("utf-8"))

    def _send_error(self, status, msg):
        body = json.dumps({"success": False, "data": None, "message": msg}, ensure_ascii=False)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        self.end_headers()
        self.wfile.write(body.encode("utf-8"))

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        self.end_headers()

    # ===== Auth =====
    def do_auth_login(self):
        body = self._read_body()
        username = body.get("username", "teacher")
        users = {
            "teacher": {"id": 1, "username": "teacher", "name": "王老师", "roles": ["TEACHER"]},
            "student": {"id": 2, "username": "2024010101", "name": "张三", "roles": ["STUDENT"]},
            "admin": {"id": 3, "username": "admin", "name": "系统管理员", "roles": ["ADMIN"]},
            "owner": {"id": 4, "username": "owner", "name": "刘主任", "roles": ["COURSE_OWNER"]},
            "supervisor": {"id": 5, "username": "supervisor", "name": "陈督导", "roles": ["SUPERVISOR"]},
        }
        user = users.get(username, users["teacher"])
        self._send_json({
            "accessToken": f"token-{username}-{uuid.uuid4().hex[:8]}",
            "refreshToken": f"refresh-{uuid.uuid4().hex}",
            "user": user,
        })

    def do_auth_me(self):
        self._send_json({
            "id": 1, "username": "teacher", "name": "王老师", "roles": ["TEACHER"],
        })

    # ===== Courses =====
    def do_list_courses(self):
        seed_data()
        self._send_json(storage["courses"])

    # ===== Assignments =====
    def do_list_assignments(self):
        seed_data()
        self._send_json(storage["assignments"])

    # ===== OCR =====
    def do_create_ocr_job(self):
        body = self._read_body()
        job_id = storage["ocr_next_id"]
        storage["ocr_next_id"] += 1

        evidence_text = body.get("evidenceText", "本次实训完成了登录注册功能、课程管理系统、实训任务发布和提交。数据库方面设计了ER实体关系图和表结构。")

        blocks = []
        plain_text = evidence_text
        real_ocr = False

        file_path = body.get("filePath")
        if file_path and os.path.isfile(file_path):
            try:
                ocr = get_ocr()
                if ocr is not None:
                    result = ocr.ocr(file_path)
                    if result and result[0]:
                        lines = []
                        for line in result[0]:
                            text = line[1][0]
                            confidence = int(line[1][1] * 100)
                            lines.append(text)
                            blocks.append({
                                "type": "paragraph", "title": text[:20],
                                "page": 1, "confidence": confidence,
                            })
                        plain_text = "\n".join(lines)
                        real_ocr = True
            except Exception as e:
                print(f"[bridge] OCR 图像识别失败，使用文本模式: {e}")

        if not real_ocr:
            for line in plain_text.split("。"):
                if line.strip():
                    blocks.append({
                        "type": "paragraph", "title": line.strip()[:30],
                        "page": 1, "confidence": 85,
                    })

        job = {
            "id": job_id,
            "assignmentId": body.get("assignmentId", 1),
            "submissionId": body.get("submissionId", 1),
            "status": "COMPLETED",
            "totalPages": 1,
            "completedPages": 1,
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "plainText": plain_text,
            "blocks": blocks,
            "realOcr": real_ocr,
        }
        storage["ocr_jobs"].append(job)
        self._send_json(job)

    def do_list_ocr_jobs(self):
        self._send_json(storage["ocr_jobs"])

    def do_get_ocr_result(self, job_id):
        for job in storage["ocr_jobs"]:
            if job["id"] == job_id:
                self._send_json({
                    "id": job_id,
                    "plainText": job["plainText"],
                    "blocks": job["blocks"],
                })
                return
        self._send_error(404, "OCR job not found")

    # ===== Rubrics =====
    def do_list_rubrics(self):
        seed_data()
        self._send_json(storage["rubrics"])

    def do_create_rubric(self):
        body = self._read_body()
        rid = storage["rubric_next_id"]
        storage["rubric_next_id"] += 1
        rubric = {
            "id": rid,
            "assignmentId": body.get("assignmentId", 1),
            "name": body.get("name", "评分标准"),
            "totalScore": body.get("totalScore", 100),
            "items": body.get("items", []),
        }
        storage["rubrics"].append(rubric)
        self._send_json(rubric)

    # ===== Grading =====
    def do_create_grading_job(self):
        body = self._read_body()
        job_id = storage["grading_job_next_id"]
        storage["grading_job_next_id"] += 1

        submission_id = body.get("submissionId", 1)
        evidence_text = body.get("evidenceText", "")
        student_name = body.get("studentName", "张三")

        # 获取评分标准
        rubric = storage["rubrics"][0] if storage["rubrics"] else {
            "totalScore": 100,
            "items": [
                {"id": 1, "title": "需求与设计", "score": 20,
                 "points": [{"title": "功能模块完整", "keywords": ["登录", "课程", "任务", "提交"]},
                            {"title": "数据库设计合理", "keywords": ["ER图", "表结构", "约束"], "synonyms": ["实体关系", "数据表"]}]},
                {"id": 2, "title": "系统实现", "score": 50, "points": []},
                {"id": 3, "title": "报告规范", "score": 30, "points": []},
            ],
        }

        # 用真实语义评分器
        scorer = get_scorer()
        weights = (0.35, 0.45, 0.20)
        from semantic_provider import score_item as semantic_score_item

        items_result = []
        total = 0
        for item in rubric["items"]:
            item_result = semantic_score_item(item, evidence_text, scorer, weights)
            items_result.append(item_result)
            total += item_result["teacherScore"]

        confidence = min(96, sum(it.get("confidence", 80) for it in items_result) // len(items_result))

        result_id = storage["grading_result_next_id"]
        storage["grading_result_next_id"] += 1

        result = {
            "id": result_id,
            "assignmentId": body.get("assignmentId", 1),
            "submissionId": submission_id,
            "studentId": body.get("studentId", 1),
            "studentName": student_name,
            "studentNo": body.get("studentNo", "2024010101"),
            "fileName": body.get("fileName", f"报告-{submission_id}.pdf"),
            "previewUrl": f"/previews/submissions/{submission_id}/report.pdf",
            "annotationPdfUrl": f"/annotations/submissions/{submission_id}/annotated.pdf",
            "totalScore": rubric["totalScore"],
            "aiScore": total,
            "teacherScore": total,
            "confidence": confidence,
            "reviewStatus": "NEEDS_REVIEW",
            "publicationStatus": "NOT_PUBLISHED",
            "overallComment": f"语义评分已完成（{scorer.source}），请教师复核。",
            "reviewedAt": None,
            "publishedAt": None,
            "items": items_result,
            "annotations": [{
                "id": result_id, "page": 1,
                "anchor": "语义评分摘要",
                "comment": f"评分来源: {scorer.source}",
                "severity": "info",
            }],
        }
        storage["grading_results"].append(result)

        job = {
            "id": job_id,
            "assignmentId": body.get("assignmentId", 1),
            "totalSubmissions": 1,
            "completedSubmissions": 1,
            "status": "COMPLETED",
            "confidence": confidence,
            "resultId": result_id,
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
        }
        storage["grading_jobs"].append(job)
        self._send_json(job)

    def do_list_grading_jobs(self):
        self._send_json(storage["grading_jobs"])

    def do_list_grading_results(self):
        self._send_json(storage["grading_results"])

    # ===== Collection (minimal) =====
    def do_collection_overview(self):
        self._send_json({
            "total": 96, "submitted": 65, "unsubmitted": 31, "lateSubmitted": 4, "processing": 18, "reviewed": 12,
        })

    def do_unsubmitted_list(self):
        self._send_json([
            {"studentId": 101, "studentName": "周明", "studentNo": "2024010105", "className": "软件2401班", "email": "zhouming@example.com"},
            {"studentId": 102, "studentName": "钱雨", "studentNo": "2024010108", "className": "软件2401班", "email": "qianyu@example.com"},
            {"studentId": 103, "studentName": "孙可", "studentNo": "2024010112", "className": "软件2401班", "email": "sunke@example.com"},
        ])

    # ===== Router =====
    def do_GET(self):
        path = self.path.split("?")[0]
        qs = self.path[len(path):]

        routes = {
            "/api/auth/me": self.do_auth_me,
            "/api/courses": self.do_list_courses,
            "/api/assignments": self.do_list_assignments,
            "/api/ocr/jobs": self.do_list_ocr_jobs,
            "/api/rubrics": self.do_list_rubrics,
            "/api/grading/jobs": self.do_list_grading_jobs,
            "/api/grading/results": self.do_list_grading_results,
        }

        # 动态路由
        if path.startswith("/api/ocr/jobs/") and path.endswith("/result"):
            try:
                job_id = int(path.split("/")[4])
                self.do_get_ocr_result(job_id)
                return
            except (ValueError, IndexError):
                pass
        if "/notifications/assignments/" in path and "/collection" in path:
            self.do_collection_overview()
            return
        if "/notifications/assignments/" in path and "/unsubmitted" in path:
            self.do_unsubmitted_list()
            return

        handler = routes.get(path)
        if handler:
            handler()
        else:
            self._send_error(404, f"未实现: {path}")

    def do_POST(self):
        path = self.path.split("?")[0]

        routes = {
            "/api/auth/login": self.do_auth_login,
            "/api/ocr/jobs": self.do_create_ocr_job,
            "/api/rubrics": self.do_create_rubric,
            "/api/grading/jobs": self.do_create_grading_job,
        }

        handler = routes.get(path)
        if handler:
            handler()
        else:
            self._send_error(404, f"未实现: {path}")


def main():
    port = int(os.environ.get("BRIDGE_PORT", "5000"))
    seed_data()
    print(f"[bridge] TrainMark AI 桥接服务器启动: http://localhost:{port}")
    print(f"[bridge] PaddleOCR + SentenceTransformer 模式")
    server = HTTPServer(("0.0.0.0", port), BridgeHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[bridge] 已停止")
        server.shutdown()


if __name__ == "__main__":
    main()
