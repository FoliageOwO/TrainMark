package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCourseRequest(
    @NotBlank String name,
    @NotBlank String code,
    @NotBlank String semester,
    String description
) {}
