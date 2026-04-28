package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record StudentImportRequest(
    @NotNull Long classId,
    List<StudentImportRow> rows
) {
  public record StudentImportRow(
      String studentNo,
      String name,
      String email,
      String phone
  ) {}
}
