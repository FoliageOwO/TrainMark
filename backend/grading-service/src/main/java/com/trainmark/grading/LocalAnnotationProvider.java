package com.trainmark.grading;

import com.trainmark.shared.dto.GradingAnnotationSummary;
import com.trainmark.shared.dto.GradingResultSummary;
import java.util.ArrayList;

public class LocalAnnotationProvider implements AnnotationProvider {
  @Override
  public GradingResultSummary annotate(GradingResultSummary result) {
    var annotations = new ArrayList<GradingAnnotationSummary>();
    annotations.add(new GradingAnnotationSummary(
        result.id() * 100 + 1,
        1,
        "自动评分摘要",
        "总分 " + result.teacherScore() + "/" + result.totalScore() + "，请复核规则评分生成的扣分证据",
        "info"
    ));
    var index = 2L;
    for (var item : result.items()) {
      var ratio = item.maxScore() == 0 ? 1.0 : (double) item.teacherScore() / item.maxScore();
      var severity = ratio < 0.7 ? "warning" : "info";
      var evidence = item.evidence().isEmpty() ? item.deductionReason() : String.join("；", item.evidence());
      annotations.add(new GradingAnnotationSummary(
          result.id() * 100 + index,
          (int) index,
          item.title(),
          item.deductionReason() + " " + evidence,
          severity
      ));
      index++;
    }
    return AnnotationProvider.withAnnotations(
        result,
        "/annotations/submissions/" + result.submissionId() + "/annotated.pdf",
        annotations
    );
  }
}
