package com.trainmark.shared.dto;

import com.trainmark.shared.ReviewStatus;
import java.time.OffsetDateTime;
import java.util.List;

public record GradingResultSummary(
    Long id,
    Long assignmentId,
    Long submissionId,
    Long studentId,
    String studentName,
    String studentNo,
    String fileName,
    String previewUrl,
    String annotationPdfUrl,
    int totalScore,
    int aiScore,
    int teacherScore,
    int confidence,
    ReviewStatus reviewStatus,
    String overallComment,
    OffsetDateTime reviewedAt,
    List<GradingItemReview> items,
    List<GradingAnnotationSummary> annotations
) {}
