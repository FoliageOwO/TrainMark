# Scoring Provider

This folder contains the scoring provider contract used by TrainMark AI.

The current MVP uses a deterministic local rules scorer. Its output mirrors the
backend `GradingResultSummary` shape so later semantic scoring or LLM-based
comment generation can replace the implementation without changing the review
and publishing APIs.

## Local Provider

```bash
python3 ai/scoring/local_provider.py \
  --result-id 2001 \
  --assignment-id 1 \
  --submission-id 7 \
  --student-id 2 \
  --student-name 张三 \
  --student-no 2024010101
```

The command writes a `GradingResultSummary`-compatible JSON document to stdout.
The local scorer now uses a deterministic keyword engine: each rubric point
collects `keywords` and `synonyms`, matches them against evidence text, applies
the point score budget, and emits both matched and missing evidence.

## Custom Rubric

Pass a rubric JSON file to score custom items:

```bash
python3 ai/scoring/local_provider.py --rubric-file ai/scoring/sample-rubric.json ...
```

The expected rubric format is:

```json
{
  "totalScore": 100,
  "items": [
    {
      "id": 1,
      "title": "需求与设计",
      "score": 20,
      "points": [
        {
          "title": "功能模块完整",
          "score": 12,
          "keywords": ["登录", "课程", "任务", "提交"],
          "synonyms": ["报告提交"]
        }
      ]
    }
  ]
}
```

Optional evidence input can be provided directly or from a file:

```bash
python3 ai/scoring/local_provider.py \
  --rubric-file ai/scoring/sample-rubric.json \
  --evidence-text "登录 课程 任务 提交 ER图 表结构 运行截图" \
  ...
```

## Semantic Scoring Migration Notes

Use `semantic-scoring.example.yml` as the first production configuration shape.
Future providers should keep stdout compatible with the local provider JSON
contract and emit operational logs to stderr.

`semantic_provider.py` is the first semantic scoring adapter. It uses
SentenceTransformers when available, following the standard semantic-textual
similarity flow of encoding texts and comparing their embeddings. If the Python
package or model is not available in a local MVP environment, it falls back to a
deterministic lexical similarity score and still emits a compatible grading
result.

```bash
python3 ai/scoring/semantic_provider.py \
  --result-id 2002 \
  --assignment-id 1 \
  --submission-id 8 \
  --student-id 3 \
  --student-name 李四 \
  --student-no 2024010102 \
  --file-name database-report.pdf \
  --rubric-file ai/scoring/sample-rubric.json
```

## Backend Command Provider

`grading-service` defaults to the in-process local provider. To call an external
scoring CLI, start the service with:

```bash
SCORING_PROVIDER=command \
SCORING_COMMAND='python3 ai/scoring/local_provider.py --result-id {resultId} --assignment-id {assignmentId} --submission-id {submissionId} --student-id {studentId} --student-name {studentName} --student-no {studentNo} --file-name {fileName}' \
pnpm dev:backend:grading
```

The placeholders are replaced by the backend before the command is executed.
Command providers may also use `{rubricJson}` to receive the current rubric as
a JSON argument.

To use the built-in semantic adapter, set `SCORING_PROVIDER=semantic`. The
backend will call:

```bash
python3 ai/scoring/semantic_provider.py \
  --result-id {resultId} \
  --assignment-id {assignmentId} \
  --submission-id {submissionId} \
  --student-id {studentId} \
  --student-name {studentName} \
  --student-no {studentNo} \
  --file-name {fileName} \
  --rubric-json {rubricJson}
```

Set `SCORING_REQUIRE_REAL=true` when the built-in adapter must fail instead of
using lexical fallback. The backend appends `--require-real` to the default
semantic command in that mode. If you override `SCORING_COMMAND`, include
`--require-real` in your custom command when the same production gate is
required.

You can still override the full command with `SCORING_COMMAND` when production
deployment needs a specific model path, Python environment or scoring wrapper.
