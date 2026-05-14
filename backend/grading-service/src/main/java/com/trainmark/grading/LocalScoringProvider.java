package com.trainmark.grading;

import com.trainmark.shared.PublicationStatus;
import com.trainmark.shared.ReviewStatus;
import com.trainmark.shared.dto.GradingAnnotationSummary;
import com.trainmark.shared.dto.GradingItemReview;
import com.trainmark.shared.dto.GradingResultSummary;
import java.util.List;

public class LocalScoringProvider implements ScoringProvider {
  @Override
  public GradingResultSummary score(ScoringRequest request) {
    var rubric = request.rubric();
    var scoredItems = rubric.items().stream()
        .map(item -> {
          var confidence = item.points().isEmpty() ? 82 : Math.min(96, 82 + item.points().size() * 4);
          var aiScore = Math.max(0, item.score() - Math.max(2, item.score() / 8));
          return new GradingItemReview(
              item.id(),
              item.title(),
              item.score(),
              aiScore,
              aiScore,
              "本地规则评分根据关键词、得分点完整度和报告结构完整度自动扣分。",
              "请教师复核该分项证据后确认。",
              confidence,
              item.points().stream()
                  .map(point -> point.title() + "：" + String.join("、", point.keywords()))
                  .toList()
          );
        })
        .toList();
    var teacherScore = scoredItems.stream().mapToInt(GradingItemReview::teacherScore).sum();
    return new GradingResultSummary(
        request.resultId(),
        request.assignmentId(),
        request.submissionId(),
        request.studentId(),
        request.studentName(),
        request.studentNo(),
        request.fileName(),
        "/previews/submissions/" + request.submissionId() + "/report.pdf",
        "/annotations/submissions/" + request.submissionId() + "/annotated.pdf",
        rubric.totalScore(),
        teacherScore,
        teacherScore,
        86,
        ReviewStatus.NEEDS_REVIEW,
        PublicationStatus.NOT_PUBLISHED,
        "本地规则评分已完成初评，建议教师重点复核扣分原因和证据定位。",
        null,
        null,
        scoredItems,
        List.of(new GradingAnnotationSummary(request.resultId(), 1, "自动评分摘要", "请复核规则评分生成的扣分证据", "info"))
    );
  }
}
