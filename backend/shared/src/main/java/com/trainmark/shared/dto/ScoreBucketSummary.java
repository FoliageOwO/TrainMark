package com.trainmark.shared.dto;

public record ScoreBucketSummary(
    String label,
    int minScore,
    int maxScore,
    int studentCount
) {}
