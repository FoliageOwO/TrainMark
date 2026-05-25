package com.trainmark.shared.dto;

import com.trainmark.shared.GradingJobStatus;
import java.time.OffsetDateTime;

public record GradingJobSummary(
    Long id,
    Long assignmentId,
    Long rubricId,
    int totalSubmissions,
    int completedSubmissions,
    GradingJobStatus status,
    int confidence,
    OffsetDateTime createdAt,
    OffsetDateTime startedAt,
    OffsetDateTime finishedAt,
    OffsetDateTime updatedAt
) {}
