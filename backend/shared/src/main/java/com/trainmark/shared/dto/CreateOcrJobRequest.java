package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateOcrJobRequest(
    @NotNull Long submissionId,
    @NotBlank String objectKey,
    String mode
) {}
