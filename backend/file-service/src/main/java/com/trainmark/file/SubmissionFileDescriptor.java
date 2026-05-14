package com.trainmark.file;

public record SubmissionFileDescriptor(
    Long submissionId,
    String fileName,
    String objectKey
) {}
