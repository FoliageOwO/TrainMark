package com.trainmark.shared.dto;

import java.util.List;

public record GradeStatisticsSummary(
    Long assignmentId,
    int submittedCount,
    int publishedCount,
    double averageScore,
    double standardDeviation,
    int maxScore,
    int minScore,
    double difficultyIndex,
    double discriminationIndex,
    List<ScoreBucketSummary> scoreBuckets
) {}
