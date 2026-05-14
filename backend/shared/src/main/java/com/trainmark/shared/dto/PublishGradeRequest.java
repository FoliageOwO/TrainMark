package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;

public record PublishGradeRequest(
    @NotBlank String operatorName,
    String message
) {}
