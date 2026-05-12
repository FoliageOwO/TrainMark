package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

public record CreateRubricRequest(
    @NotNull Long assignmentId,
    @NotBlank String name,
    @Positive int totalScore,
    List<RubricItemRequest> items
) {}
