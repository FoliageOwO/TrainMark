package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateNotificationRequest(
    Long assignmentId,
    @NotNull Long recipientId,
    @NotBlank String title,
    @NotBlank String message,
    @NotBlank String type,
    String targetUrl
) {}
