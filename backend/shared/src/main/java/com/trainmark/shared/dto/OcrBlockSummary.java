package com.trainmark.shared.dto;

public record OcrBlockSummary(
    String type,
    String title,
    int page,
    int confidence
) {}
