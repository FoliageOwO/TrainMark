package com.trainmark.shared.dto;

import com.trainmark.shared.ReviewStatus;
import com.trainmark.shared.PublicationStatus;
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
    PublicationStatus publicationStatus,
    String overallComment,
    OffsetDateTime reviewedAt,
    OffsetDateTime publishedAt,
    List<GradingItemReview> items,
    List<GradingAnnotationSummary> annotations
) {}
