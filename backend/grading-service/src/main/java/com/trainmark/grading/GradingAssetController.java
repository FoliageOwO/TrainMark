package com.trainmark.grading;

import com.trainmark.shared.dto.GradingResultSummary;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GradingAssetController {
  private final GradingService gradingService;

  public GradingAssetController(GradingService gradingService) {
    this.gradingService = gradingService;
  }

  @GetMapping(value = "/annotations/submissions/{submissionId}/annotated.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
  public ResponseEntity<byte[]> annotationPdf(@PathVariable("submissionId") Long submissionId) {
    var fileName = "annotated-%d.pdf".formatted(submissionId);
    var result = gradingService.findResultBySubmission(submissionId);
    return binary(fileName, MediaType.APPLICATION_PDF, pdfBytes(result
        .map(this::annotationLines)
        .orElseGet(() -> List.of(
            "TrainMark AI Annotated Report",
            "Submission ID: " + submissionId,
            "No grading result found yet"
        ))));
  }

  @GetMapping(value = "/exports/assignments/{assignmentId}/{fileName:.+}")
  public ResponseEntity<byte[]> exportFile(
      @PathVariable("assignmentId") Long assignmentId,
      @PathVariable("fileName") String fileName
  ) {
    if (fileName.toLowerCase().endsWith(".pdf")) {
      return binary(fileName, MediaType.APPLICATION_PDF, pdfBytes(List.of(
          "TrainMark AI Grade Export",
          "Assignment ID: " + assignmentId,
          "Rows: 1"
      )));
    }
    if (fileName.toLowerCase().endsWith(".zip")) {
      return binary(fileName, MediaType.parseMediaType("application/zip"), zipBytes(assignmentId));
    }
    return binary(fileName, MediaType.parseMediaType("text/csv;charset=UTF-8"), csvBytes(assignmentId));
  }

  private ResponseEntity<byte[]> binary(String fileName, MediaType mediaType, byte[] body) {
    return ResponseEntity.ok()
        .contentType(mediaType)
        .contentLength(body.length)
        .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fileName).build().toString())
        .body(body);
  }

  private byte[] csvBytes(Long assignmentId) {
    var csv = "\uFEFFassignmentId,studentNo,studentName,score,status\n"
        + assignmentId + ",2024010101,张三,88,PUBLISHED\n";
    return csv.getBytes(StandardCharsets.UTF_8);
  }

  private byte[] zipBytes(Long assignmentId) {
    try {
      var output = new ByteArrayOutputStream();
      try (var zip = new ZipOutputStream(output, StandardCharsets.UTF_8)) {
        zip.putNextEntry(new ZipEntry("grades.csv"));
        zip.write(csvBytes(assignmentId));
        zip.closeEntry();
        var results = gradingService.listResults(assignmentId, null);
        for (var result : results) {
          zip.putNextEntry(new ZipEntry("annotations/annotated-%d.pdf".formatted(result.submissionId())));
          zip.write(pdfBytes(annotationLines(result)));
          zip.closeEntry();
        }
        zip.putNextEntry(new ZipEntry("README.txt"));
        zip.write(zipReadme(assignmentId, results.size()).getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
      }
      return output.toByteArray();
    } catch (IOException exception) {
      throw new IllegalStateException("Failed to build grade export zip", exception);
    }
  }

  private String zipReadme(Long assignmentId, int annotationCount) {
    return "TrainMark AI grade export bundle\n"
        + "Assignment ID: " + assignmentId + "\n"
        + "Included annotated PDFs: " + annotationCount + "\n";
  }

  private List<String> annotationLines(GradingResultSummary result) {
    var lines = new ArrayList<String>();
    lines.add("TrainMark AI Annotated Report");
    lines.add("Submission ID: " + result.submissionId());
    lines.add("Student: " + result.studentName() + " (" + result.studentNo() + ")");
    lines.add("Score: " + result.teacherScore() + "/" + result.totalScore());
    lines.add("Review: " + result.reviewStatus() + " / Publish: " + result.publicationStatus());
    lines.add("Overall: " + shorten(result.overallComment(), 86));
    lines.add("Annotations:");
    result.annotations().stream()
        .limit(6)
        .forEach(annotation -> lines.add("- [" + annotation.severity() + "] "
            + shorten(annotation.anchorText() + ": " + annotation.comment(), 92)));
    lines.add("Items:");
    result.items().stream()
        .limit(6)
        .forEach(item -> {
          lines.add("- " + item.title() + " " + item.teacherScore() + "/" + item.maxScore());
          item.evidence().stream()
              .limit(2)
              .forEach(evidence -> lines.add("  evidence: " + shorten(evidence, 88)));
        });
    return lines;
  }

  private String shorten(String value, int maxLength) {
    if (value == null || value.length() <= maxLength) {
      return value == null ? "" : value;
    }
    return value.substring(0, maxLength - 3) + "...";
  }

  private byte[] pdfBytes(List<String> lines) {
    var content = new StringBuilder("BT\n/F1 18 Tf\n72 760 Td\n");
    for (var index = 0; index < lines.size(); index++) {
      if (index > 0) {
        content.append("0 -28 Td\n");
      }
      content.append("(").append(pdfEscape(lines.get(index))).append(") Tj\n");
    }
    content.append("ET");
    var stream = content.toString().getBytes(StandardCharsets.UTF_8);
    var objects = List.of(
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        "<< /Length " + stream.length + " >>\nstream\n" + new String(stream, StandardCharsets.UTF_8) + "\nendstream"
    );
    var output = new StringBuilder("%PDF-1.4\n");
    var offsets = new java.util.ArrayList<Integer>();
    for (var index = 0; index < objects.size(); index++) {
      offsets.add(output.length());
      output.append(index + 1).append(" 0 obj\n").append(objects.get(index)).append("\nendobj\n");
    }
    var xrefOffset = output.length();
    output.append("xref\n0 ").append(objects.size() + 1).append("\n0000000000 65535 f \n");
    for (var offset : offsets) {
      output.append("%010d 00000 n \n".formatted(offset));
    }
    output.append("trailer\n<< /Size ").append(objects.size() + 1).append(" /Root 1 0 R >>\nstartxref\n")
        .append(xrefOffset).append("\n%%EOF\n");
    return output.toString().getBytes(StandardCharsets.UTF_8);
  }

  private String pdfEscape(String value) {
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
  }
}
