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
        { "title": "功能模块完整", "keywords": ["登录", "课程", "任务", "提交"] }
      ]
    }
  ]
}
```

## Semantic Scoring Migration Notes

Use `semantic-scoring.example.yml` as the first production configuration shape.
Future providers should keep stdout compatible with the local provider JSON
contract and emit operational logs to stderr.

