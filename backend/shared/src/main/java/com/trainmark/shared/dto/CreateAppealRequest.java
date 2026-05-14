package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateAppealRequest(
    @NotNull Long resultId,
    Long rubricItemId,
    @NotNull Long studentId,
    @NotBlank String reason,
    @NotBlank String requestedChange
) {}
