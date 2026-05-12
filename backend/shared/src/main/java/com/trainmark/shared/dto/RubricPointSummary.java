package com.trainmark.shared.dto;

import java.util.List;

public record RubricPointSummary(
    Long id,
    String title,
    String description,
    int score,
    List<String> keywords,
    List<String> synonyms
) {}
