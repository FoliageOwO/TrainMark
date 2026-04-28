package com.trainmark.shared.dto;

import java.util.List;

public record StudentImportResult(
    int total,
    int created,
    int skipped,
    List<String> warnings
) {}
