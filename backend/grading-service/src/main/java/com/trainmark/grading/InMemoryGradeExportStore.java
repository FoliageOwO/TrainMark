package com.trainmark.grading;

import com.trainmark.shared.dto.CreateGradeExportRequest;
import com.trainmark.shared.dto.GradeExportSummary;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.grading.export-store", havingValue = "memory", matchIfMissing = true)
public class InMemoryGradeExportStore implements GradeExportStore {
  private final AtomicLong exportIds = new AtomicLong(2);
  private final Map<Long, GradeExportSummary> exports = new LinkedHashMap<>();

  public InMemoryGradeExportStore() {
    exports.put(1L, new GradeExportSummary(
        1L,
        1L,
        "Java Web 综合实训-成绩单.csv",
        "CSV",
        48,
        "/exports/assignments/1/grades.csv",
        "READY",
        OffsetDateTime.now().minusMinutes(25)
    ));
  }

  @Override
  public Collection<GradeExportSummary> listGradeExports(Long assignmentId) {
    return exports.values().stream()
        .filter(item -> assignmentId == null || assignmentId.equals(item.assignmentId()))
        .toList();
  }

  @Override
  public GradeExportSummary createGradeExport(CreateGradeExportRequest request, int rowCount) {
    return createGradeExport(request, rowCount, "READY");
  }

  @Override
  public GradeExportSummary createGradeExport(CreateGradeExportRequest request, int rowCount, String status) {
    var id = exportIds.getAndIncrement();
    var format = request.format().toUpperCase();
    var suffix = suffix(format);
    var export = new GradeExportSummary(
        id,
        request.assignmentId(),
        "assignment-%d-grades.%s".formatted(request.assignmentId(), suffix),
        format,
        rowCount,
        "/exports/assignments/%d/grades-%d.%s".formatted(request.assignmentId(), id, suffix),
        status,
        OffsetDateTime.now()
    );
    exports.put(id, export);
    return export;
  }

  @Override
  public GradeExportSummary markGradeExportReady(Long exportId, int rowCount) {
    var export = exports.get(exportId);
    if (export == null) {
      throw new IllegalArgumentException("Grade export not found: " + exportId);
    }
    var ready = new GradeExportSummary(
        export.id(),
        export.assignmentId(),
        export.fileName(),
        export.format(),
        rowCount,
        export.downloadUrl(),
        "READY",
        export.createdAt()
    );
    exports.put(exportId, ready);
    return ready;
  }

  @Override
  public void markGradeExportFailed(Long exportId) {
    var export = exports.get(exportId);
    if (export == null) {
      throw new IllegalArgumentException("Grade export not found: " + exportId);
    }
    exports.put(exportId, new GradeExportSummary(
        export.id(),
        export.assignmentId(),
        export.fileName(),
        export.format(),
        export.rowCount(),
        export.downloadUrl(),
        "FAILED",
        export.createdAt()
    ));
  }

  private String suffix(String format) {
    return switch (format) {
      case "PDF" -> "pdf";
      case "ZIP" -> "zip";
      default -> "csv";
    };
  }
}
