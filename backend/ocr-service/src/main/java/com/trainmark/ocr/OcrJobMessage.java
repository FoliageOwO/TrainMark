package com.trainmark.ocr;

public record OcrJobMessage(
    Long jobId,
    Long submissionId,
    String objectKey,
    String mode
) {}
