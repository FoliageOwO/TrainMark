package com.trainmark.shared.dto;

import com.trainmark.shared.PublicationStatus;
import java.time.OffsetDateTime;

public record GradePublicationSummary(
    Long resultId,
    Long assignmentId,
    Long studentId,
    String studentName,
    String studentNo,
    int teacherScore,
    PublicationStatus publicationStatus,
    OffsetDateTime publishedAt
) {}
