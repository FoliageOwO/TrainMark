package com.trainmark.shared.dto;

import com.trainmark.shared.AppealStatus;
import java.time.OffsetDateTime;

public record AppealSummary(
    Long id,
    Long resultId,
    Long rubricItemId,
    Long studentId,
    String studentName,
    String reason,
    String requestedChange,
    AppealStatus status,
    String teacherReply,
    OffsetDateTime createdAt,
    OffsetDateTime resolvedAt
) {}
