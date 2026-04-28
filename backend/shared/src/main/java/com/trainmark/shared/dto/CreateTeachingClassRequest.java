package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateTeachingClassRequest(
    @NotNull Long courseId,
    @NotBlank String name,
    String major,
    String grade
) {}
