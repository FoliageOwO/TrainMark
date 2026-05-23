package com.trainmark.file;

public record SubmissionFileDescriptor(
    Long submissionId,
    Long assignmentId,
    Long studentId,
    String fileName,
    String objectKey
) {}
