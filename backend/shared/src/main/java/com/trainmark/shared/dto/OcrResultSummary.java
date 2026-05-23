package com.trainmark.shared.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import java.util.List;

public record OcrResultSummary(
    Long jobId,
    Long submissionId,
    @JsonAlias("plainText")
    String plainTextPreview,
    List<OcrBlockSummary> blocks
) {}
