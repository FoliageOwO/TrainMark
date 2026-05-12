package com.trainmark.shared.dto;

import com.trainmark.shared.NotificationChannel;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ReminderRequest(
    @NotNull Long assignmentId,
    @NotEmpty List<Long> studentIds,
    @NotEmpty List<NotificationChannel> channels,
    String message
) {}
