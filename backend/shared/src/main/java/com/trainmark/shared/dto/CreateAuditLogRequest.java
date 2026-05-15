package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateAuditLogRequest(
    @NotBlank String actorName,
    @NotBlank String action,
    @NotBlank String resourceType,
    String resourceId,
    String detail,
    String ipAddress
) {}
