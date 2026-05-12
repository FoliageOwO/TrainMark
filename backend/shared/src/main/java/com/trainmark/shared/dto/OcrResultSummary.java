package com.trainmark.shared.dto;

import java.util.List;

public record OcrResultSummary(
    Long jobId,
    Long submissionId,
    String plainTextPreview,
    List<OcrBlockSummary> blocks
) {}
