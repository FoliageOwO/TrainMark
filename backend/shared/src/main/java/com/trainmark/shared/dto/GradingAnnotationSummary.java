package com.trainmark.shared.dto;

public record GradingAnnotationSummary(
    Long id,
    int page,
    String anchorText,
    String comment,
    String severity
) {}
