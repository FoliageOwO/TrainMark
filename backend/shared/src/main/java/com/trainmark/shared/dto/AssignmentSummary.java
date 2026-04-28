package com.trainmark.shared.dto;

import com.trainmark.shared.AssignmentStatus;
import java.time.OffsetDateTime;

public record AssignmentSummary(
    Long id,
    Long courseId,
    String title,
    OffsetDateTime deadline,
    Integer totalScore,
    AssignmentStatus status,
    boolean similarityCheckEnabled,
    boolean aiGradingEnabled
) {}
