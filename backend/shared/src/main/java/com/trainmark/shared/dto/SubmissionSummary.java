package com.trainmark.shared.dto;

import com.trainmark.shared.SubmissionStatus;
import java.time.OffsetDateTime;

public record SubmissionSummary(
    Long id,
    Long assignmentId,
    Long studentId,
    String studentName,
    String studentNo,
    String fileName,
    int version,
    SubmissionStatus status,
    OffsetDateTime submittedAt
) {}
