package com.trainmark.shared.dto;

public record SystemSettingSummary(
    String key,
    String name,
    String value,
    String category,
    boolean sensitive
) {}
