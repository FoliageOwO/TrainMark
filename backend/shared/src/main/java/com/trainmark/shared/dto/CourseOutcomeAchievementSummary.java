package com.trainmark.shared.dto;

public record CourseOutcomeAchievementSummary(
    String courseOutcomeCode,
    String title,
    double targetValue,
    double achievedValue,
    String status
) {}
