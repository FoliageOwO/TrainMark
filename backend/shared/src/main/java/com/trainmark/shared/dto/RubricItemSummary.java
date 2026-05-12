package com.trainmark.shared.dto;

import java.util.List;

public record RubricItemSummary(
    Long id,
    String title,
    int score,
    String courseOutcomeCode,
    List<RubricPointSummary> points
) {}
