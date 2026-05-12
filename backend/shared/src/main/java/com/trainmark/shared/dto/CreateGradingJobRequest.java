package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateGradingJobRequest(
    @NotNull Long assignmentId,
    @NotNull Long rubricId,
    @NotEmpty List<Long> submissionIds
) {}
