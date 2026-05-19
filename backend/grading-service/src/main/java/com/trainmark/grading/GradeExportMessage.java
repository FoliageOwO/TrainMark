package com.trainmark.grading;

public record GradeExportMessage(
    Long exportId,
    Long assignmentId
) {}
