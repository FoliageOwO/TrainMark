package com.trainmark.grading;

import com.trainmark.shared.dto.GradingAnnotationSummary;
import com.trainmark.shared.dto.GradingResultSummary;
import java.util.List;

public interface AnnotationProvider {
  GradingResultSummary annotate(GradingResultSummary result);

  static GradingResultSummary withAnnotations(
      GradingResultSummary result,
      String annotationPdfUrl,
      List<GradingAnnotationSummary> annotations
  ) {
    return new GradingResultSummary(
        result.id(),
        result.assignmentId(),
        result.submissionId(),
        result.studentId(),
        result.studentName(),
        result.studentNo(),
        result.fileName(),
        result.previewUrl(),
        annotationPdfUrl,
        result.totalScore(),
        result.aiScore(),
        result.teacherScore(),
        result.confidence(),
        result.reviewStatus(),
        result.publicationStatus(),
        result.overallComment(),
        result.reviewedAt(),
        result.publishedAt(),
        result.items(),
        annotations
    );
  }
}
