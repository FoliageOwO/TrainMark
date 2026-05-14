package com.trainmark.grading;

import com.trainmark.shared.PublicationStatus;
import com.trainmark.shared.dto.GradingResultSummary;
import java.time.OffsetDateTime;

final class GradingResultStoreSupport {
  private GradingResultStoreSupport() {}

  static GradingResultSummary withPublicationStatus(
      GradingResultSummary result,
      PublicationStatus publicationStatus,
      OffsetDateTime publishedAt
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
        result.annotationPdfUrl(),
        result.totalScore(),
        result.aiScore(),
        result.teacherScore(),
        result.confidence(),
        result.reviewStatus(),
        publicationStatus,
        result.overallComment(),
        result.reviewedAt(),
        publishedAt,
        result.items(),
        result.annotations()
    );
  }
}
