package com.trainmark.shared.dto;

import java.util.List;

public record RubricSummary(
    Long id,
    Long assignmentId,
    String name,
    int totalScore,
    List<RubricItemSummary> items
) {}
