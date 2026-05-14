package com.trainmark.shared.dto;

public record LossPointSummary(
    Long rubricItemId,
    String title,
    String courseOutcomeCode,
    double averageLostScore,
    int affectedStudentCount,
    String topReason
) {}
