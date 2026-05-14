package com.trainmark.shared.dto;

import java.time.OffsetDateTime;

public record UploadObjectSummary(
    String uploadId,
    String objectKey,
    long size,
    OffsetDateTime storedAt
) {}
