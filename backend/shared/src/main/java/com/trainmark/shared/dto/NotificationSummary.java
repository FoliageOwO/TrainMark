package com.trainmark.shared.dto;

import java.time.OffsetDateTime;

public record NotificationSummary(
    Long id,
    String title,
    String message,
    String type,
    boolean isRead,
    String targetUrl,
    OffsetDateTime createdAt
) {}
