package com.trainmark.shared.dto;

import java.util.List;

public record GradingItemReview(
    Long rubricItemId,
    String title,
    int maxScore,
    int aiScore,
    int teacherScore,
    String deductionReason,
    String teacherComment,
    int confidence,
    List<String> evidence
) {}
