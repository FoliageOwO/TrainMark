package com.trainmark.ocr;

public record DocumentPreprocessResult(
    String sourceObjectKey,
    String normalizedObjectKey,
    String sourceFormat,
    String targetFormat,
    int pageCount,
    int imageCount,
    int tableHintCount
) {}
