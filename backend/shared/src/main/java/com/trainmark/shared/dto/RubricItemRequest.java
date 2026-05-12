package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.util.List;

public record RubricItemRequest(
    @NotBlank String title,
    @Positive int score,
    String courseOutcomeCode,
    List<RubricPointRequest> points
) {}
