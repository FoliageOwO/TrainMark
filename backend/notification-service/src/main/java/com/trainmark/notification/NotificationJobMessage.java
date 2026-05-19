package com.trainmark.notification;

import com.trainmark.shared.NotificationChannel;
import java.time.OffsetDateTime;
import java.util.List;

public record NotificationJobMessage(
    Long assignmentId,
    List<Long> studentIds,
    List<NotificationChannel> channels,
    String message,
    OffsetDateTime scheduledAt
) {}
