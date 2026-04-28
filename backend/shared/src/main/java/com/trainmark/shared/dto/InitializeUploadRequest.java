package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record InitializeUploadRequest(
    @NotNull Long assignmentId,
    @NotNull Long studentId,
    @NotBlank String fileName,
    @NotBlank String contentType,
    @Positive long fileSize,
    String checksum
) {}
