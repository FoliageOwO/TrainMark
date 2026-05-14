package com.trainmark.shared.dto;

import com.trainmark.shared.SimilarityJobStatus;
import java.time.OffsetDateTime;
import java.util.List;

public record SimilarityJobSummary(
    Long id,
    Long assignmentId,
    int checkedSubmissionCount,
    SimilarityJobStatus status,
    double maxSimilarity,
    int highRiskPairCount,
    OffsetDateTime createdAt,
    List<SimilarityMatchSummary> matches
) {}
