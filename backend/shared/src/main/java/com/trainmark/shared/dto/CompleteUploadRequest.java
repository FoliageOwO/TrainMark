package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;

public record CompleteUploadRequest(
    @NotBlank String uploadId,
    @NotBlank String objectKey,
    String checksum
) {}
