package com.trainmark.grading;

import com.trainmark.shared.dto.GradingAnnotationSummary;
import com.trainmark.shared.dto.GradingResultSummary;
import java.util.List;

public class LocalAnnotationProvider implements AnnotationProvider {
  @Override
  public GradingResultSummary annotate(GradingResultSummary result) {
    return AnnotationProvider.withAnnotations(
        result,
        "/annotations/submissions/" + result.submissionId() + "/annotated.pdf",
        List.of(new GradingAnnotationSummary(
            result.id(),
            1,
            "自动评分摘要",
            "请复核规则评分生成的扣分证据",
            "info"
        ))
    );
  }
}
