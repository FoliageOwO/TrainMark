package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;

public record WithdrawGradeRequest(
    @NotBlank String operatorName,
    @NotBlank String reason
) {}
