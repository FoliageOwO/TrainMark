package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateGradeExportRequest(
    @NotNull Long assignmentId,
    @NotBlank String format,
    @NotBlank String operatorName
) {}
