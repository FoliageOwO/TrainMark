package com.trainmark.grading;

import com.trainmark.shared.dto.GradingResultSummary;

public interface ScoringProvider {
  GradingResultSummary score(ScoringRequest request);
}
