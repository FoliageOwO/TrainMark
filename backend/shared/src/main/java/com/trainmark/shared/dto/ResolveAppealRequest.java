package com.trainmark.shared.dto;

import com.trainmark.shared.AppealStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ResolveAppealRequest(
    @NotNull AppealStatus status,
    @NotBlank String teacherReply
) {}
