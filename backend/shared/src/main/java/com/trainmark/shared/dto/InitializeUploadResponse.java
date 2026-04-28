package com.trainmark.shared.dto;

import com.trainmark.shared.FileUploadStatus;
import java.time.OffsetDateTime;

public record InitializeUploadResponse(
    String uploadId,
    Long assignmentId,
    Long studentId,
    String objectKey,
    int partSizeMb,
    FileUploadStatus status,
    OffsetDateTime expiresAt
) {}
