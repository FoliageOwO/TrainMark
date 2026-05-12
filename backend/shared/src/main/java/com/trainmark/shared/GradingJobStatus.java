package com.trainmark.shared;

public enum GradingJobStatus {
  PENDING,
  OCR_RUNNING,
  STRUCTURING,
  SCORING,
  ANNOTATING,
  COMPLETED,
  FAILED,
  RETRYING
}
