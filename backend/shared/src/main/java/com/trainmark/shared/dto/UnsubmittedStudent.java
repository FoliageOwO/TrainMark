package com.trainmark.shared.dto;

public record UnsubmittedStudent(
    Long studentId,
    String studentNo,
    String name,
    String className,
    String email
) {}
