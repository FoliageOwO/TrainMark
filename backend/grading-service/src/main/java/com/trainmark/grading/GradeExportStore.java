package com.trainmark.grading;

import com.trainmark.shared.dto.CreateGradeExportRequest;
import com.trainmark.shared.dto.GradeExportSummary;
import java.util.Collection;

public interface GradeExportStore {
  Collection<GradeExportSummary> listGradeExports(Long assignmentId);

  GradeExportSummary createGradeExport(CreateGradeExportRequest request, int rowCount);
}
