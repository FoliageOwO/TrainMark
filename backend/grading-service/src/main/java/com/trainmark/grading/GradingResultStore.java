package com.trainmark.grading;

import com.trainmark.shared.PublicationStatus;
import com.trainmark.shared.ReviewStatus;
import com.trainmark.shared.dto.GradingResultSummary;
import java.util.Collection;
import java.util.Optional;

public interface GradingResultStore {
  Collection<GradingResultSummary> listResults(Long assignmentId, ReviewStatus reviewStatus);

  Optional<GradingResultSummary> findResult(Long resultId);

  boolean hasSubmissionResult(Long submissionId);

  long nextResultId();

  GradingResultSummary saveScoredResult(GradingResultSummary result);

  GradingResultSummary saveReviewedResult(GradingResultSummary result);

  GradingResultSummary savePublicationStatus(
      GradingResultSummary result,
      PublicationStatus publicationStatus,
      java.time.OffsetDateTime publishedAt
  );
}
