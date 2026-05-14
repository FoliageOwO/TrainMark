package com.trainmark.shared.dto;

import java.time.OffsetDateTime;

public record GradePublicationAuditEntry(
    Long id,
    Long resultId,
    String action,
    String operatorName,
    String reason,
    OffsetDateTime createdAt
) {}
