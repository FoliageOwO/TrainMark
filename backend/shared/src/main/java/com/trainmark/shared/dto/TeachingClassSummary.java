package com.trainmark.shared.dto;

public record TeachingClassSummary(
    Long id,
    Long courseId,
    String name,
    String major,
    String grade,
    int studentCount
) {}
