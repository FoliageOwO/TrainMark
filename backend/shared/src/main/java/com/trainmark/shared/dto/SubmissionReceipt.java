package com.trainmark.shared.dto;

import com.trainmark.shared.SubmissionStatus;
import java.time.OffsetDateTime;

public record SubmissionReceipt(
    Long submissionId,
    Long assignmentId,
    Long studentId,
    String fileName,
    String objectKey,
    int version,
    SubmissionStatus status,
    OffsetDateTime submittedAt
) {}
