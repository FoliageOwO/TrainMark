package com.trainmark.shared.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.OffsetDateTime;
import java.util.List;

public record CreateAssignmentRequest(
    @NotNull Long courseId,
    @NotBlank String title,
    String description,
    @NotNull @Future OffsetDateTime deadline,
    @Positive Integer totalScore,
    List<Long> classIds,
    boolean similarityCheckEnabled,
    boolean aiGradingEnabled
) {}
