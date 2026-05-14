package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateSimilarityJobRequest(
    @NotNull Long assignmentId,
    @NotEmpty List<Long> submissionIds,
    boolean includeHistory
) {}
