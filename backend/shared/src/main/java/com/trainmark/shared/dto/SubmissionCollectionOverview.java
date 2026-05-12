package com.trainmark.shared.dto;

public record SubmissionCollectionOverview(
    Long assignmentId,
    int totalStudents,
    int submitted,
    int unsubmitted,
    int lateSubmitted,
    int processing,
    int reviewed,
    int published
) {}
