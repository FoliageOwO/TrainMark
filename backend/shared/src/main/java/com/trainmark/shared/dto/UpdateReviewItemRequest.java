package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record UpdateReviewItemRequest(
    @NotNull Long rubricItemId,
    @PositiveOrZero int teacherScore,
    @NotBlank String teacherComment
) {}
