package com.trainmark.shared.dto;

import com.trainmark.shared.CourseStatus;

public record CourseSummary(
    Long id,
    String name,
    String code,
    String semester,
    CourseStatus status,
    int classCount,
    int studentCount
) {}
