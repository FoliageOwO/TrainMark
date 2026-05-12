package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.util.List;

public record RubricPointRequest(
    @NotBlank String title,
    String description,
    @Positive int score,
    List<String> keywords,
    List<String> synonyms
) {}
