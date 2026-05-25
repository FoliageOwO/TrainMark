package com.trainmark.shared.dto;

import com.trainmark.shared.OcrJobStatus;
import java.time.OffsetDateTime;

public record OcrJobSummary(
    Long id,
    Long submissionId,
    String objectKey,
    OcrJobStatus status,
    int pageCount,
    int textBlockCount,
    int tableCount,
    int confidence,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
