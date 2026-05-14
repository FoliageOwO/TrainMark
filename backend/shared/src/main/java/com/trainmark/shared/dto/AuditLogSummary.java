package com.trainmark.shared.dto;

import java.time.OffsetDateTime;

public record AuditLogSummary(
    Long id,
    String actorName,
    String action,
    String resourceType,
    String resourceId,
    String detail,
    String ipAddress,
    OffsetDateTime createdAt
) {}
