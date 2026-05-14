package com.trainmark.shared.dto;

public record SimilarityMatchSummary(
    Long sourceSubmissionId,
    Long targetSubmissionId,
    String sourceStudentName,
    String targetStudentName,
    double similarity,
    String matchedSection,
    String riskLevel
) {}
