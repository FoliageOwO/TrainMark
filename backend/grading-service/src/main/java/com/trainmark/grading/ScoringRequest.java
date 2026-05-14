package com.trainmark.grading;

import com.trainmark.shared.dto.RubricSummary;

public record ScoringRequest(
    Long resultId,
    Long assignmentId,
    Long submissionId,
    Long studentId,
    String studentName,
    String studentNo,
    String fileName,
    RubricSummary rubric
) {}
