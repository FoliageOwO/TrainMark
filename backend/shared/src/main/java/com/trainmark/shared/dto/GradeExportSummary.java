package com.trainmark.shared.dto;

import java.time.OffsetDateTime;

public record GradeExportSummary(
    Long id,
    Long assignmentId,
    String fileName,
    String format,
    int rowCount,
    String downloadUrl,
    String status,
    OffsetDateTime createdAt
) {}
