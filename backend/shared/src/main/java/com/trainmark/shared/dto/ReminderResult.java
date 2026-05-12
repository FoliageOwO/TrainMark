package com.trainmark.shared.dto;

import com.trainmark.shared.NotificationChannel;
import com.trainmark.shared.NotificationStatus;
import java.time.OffsetDateTime;
import java.util.List;

public record ReminderResult(
    Long assignmentId,
    int recipientCount,
    int messageCount,
    List<NotificationChannel> channels,
    NotificationStatus status,
    OffsetDateTime scheduledAt
) {}
