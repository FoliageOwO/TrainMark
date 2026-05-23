package com.trainmark.shared.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public record GradingAnnotationSummary(
    Long id,
    int page,
    @JsonAlias("anchor")
    String anchorText,
    String comment,
    String severity
) {}
