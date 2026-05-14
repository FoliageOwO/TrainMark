package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;

public record ReviewDecisionRequest(
    @NotBlank String reviewerName,
    String overallComment
) {}
