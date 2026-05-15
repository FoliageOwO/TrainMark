package com.trainmark.grading;

import com.trainmark.shared.dto.GradingResultSummary;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
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
    return binary(fileName, MediaType.APPLICATION_PDF, pdfBytes(result.orElse(null)));
  }

  @GetMapping(value = "/exports/assignments/{assignmentId}/{fileName:.+}")
  public ResponseEntity<byte[]> exportFile(
      @PathVariable("assignmentId") Long assignmentId,
      @PathVariable("fileName") String fileName
  ) {
    if (fileName.toLowerCase().endsWith(".pdf")) {
      return binary(fileName, MediaType.APPLICATION_PDF, pdfBytes(null));
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
          zip.write(pdfBytes(result));
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

  /**
   * Generates a real PDF with annotations using Apache PDFBox.
   * Includes score summary, per-item breakdown, deduction reasons, and annotation comments.
   */
  private byte[] pdfBytes(GradingResultSummary result) {
    try (var document = new PDDocument()) {
      var page = new PDPage(PDRectangle.A4);
      document.addPage(page);

      var margin = 72f;
      var pageWidth = page.getMediaBox().getWidth();
      var y = page.getMediaBox().getUpperRightY() - margin;
      var contentWidth = pageWidth - 2 * margin;
      var fonts = loadFonts(document);

      try (var contentStream = new PDPageContentStream(document, page)) {
        // Title
        contentStream.beginText();
        contentStream.setFont(fonts.heading(), 18);
        contentStream.newLineAtOffset(margin, y);
        contentStream.showText(fonts.text("TrainMark AI 批改批注报告"));
        contentStream.endText();
        y -= 36;

        if (result == null) {
          // Placeholder for no result
          contentStream.beginText();
          contentStream.setFont(fonts.body(), 12);
          contentStream.newLineAtOffset(margin, y);
          contentStream.showText(fonts.text("暂无批改结果"));
          contentStream.endText();
        } else {
          // Score summary
          y = drawSection(contentStream, fonts, margin, y, contentWidth, "成绩总览", List.of(
              "学生: " + result.studentName() + " (" + result.studentNo() + ")",
              "总分: " + result.teacherScore() + " / " + result.totalScore(),
              "AI 初评: " + result.aiScore() + " / " + result.totalScore(),
              "复核状态: " + result.reviewStatus(),
              "发布状态: " + result.publicationStatus(),
              "置信度: " + result.confidence() + "%"
          ));

          // Overall comment
          if (result.overallComment() != null && !result.overallComment().isBlank()) {
            y = drawSection(contentStream, fonts, margin, y, contentWidth, "总评", List.of(
                result.overallComment()
            ));
          }

          // Per-item scores
          y = drawSection(contentStream, fonts, margin, y, contentWidth, "分项得分",
              result.items().stream()
                  .map(item -> item.title() + ": " + item.teacherScore() + "/" + item.maxScore()
                      + (item.deductionReason() != null && !item.deductionReason().isBlank()
                          ? "  [扣分: " + item.deductionReason() + "]"
                          : ""))
                  .toList());

          // Annotations
          if (!result.annotations().isEmpty()) {
            y = drawSection(contentStream, fonts, margin, y, contentWidth, "批注详情",
                result.annotations().stream()
                    .limit(10)
                    .map(a -> "[" + a.severity() + "] 第" + a.page() + "页 - " + a.comment())
                    .toList());
          }
        }
      }

      var output = new ByteArrayOutputStream();
      document.save(output);
      return output.toByteArray();
    } catch (IOException exception) {
      throw new IllegalStateException("Failed to generate annotation PDF", exception);
    }
  }

  /**
   * Draws a section with heading and bullet points. Returns the new Y position.
   */
  private float drawSection(PDPageContentStream cs, PdfFonts fonts, float margin, float y, float width,
                            String heading, List<String> items) throws IOException {
    var gap = 18f;
    if (y < margin + 60) {
      // Page is full, don't draw more
      return y;
    }

    // Section heading with underline
    cs.beginText();
    cs.setFont(fonts.heading(), 14);
    cs.newLineAtOffset(margin, y);
    cs.showText(fonts.text(heading));
    cs.endText();
    y -= 20;

    // Underline
    cs.moveTo(margin, y + 2);
    cs.lineTo(margin + width * 0.3f, y + 2);
    cs.stroke();
    y -= 6;

    // Bullet items
    for (var item : items) {
      if (y < margin + 30) break;
      cs.beginText();
      cs.setFont(fonts.body(), 10);
      cs.newLineAtOffset(margin + 8, y);
      // Truncate very long lines
      var display = item.length() > 100 ? item.substring(0, 97) + "..." : item;
      cs.showText(fonts.text("- " + display));
      cs.endText();
      y -= 16;
    }

    return y - gap;
  }

  private PdfFonts loadFonts(PDDocument document) throws IOException {
    var configuredFont = System.getenv("ANNOTATION_PDF_FONT_PATH");
    var bodyFont = loadFirstExistingFont(document, configuredFont, List.of(
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
        "/mnt/c/Windows/Fonts/simhei.ttf",
        "/mnt/c/Windows/Fonts/msyh.ttc"
    ));
    var headingFont = loadFirstExistingFont(document, configuredFont, List.of(
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
        "/mnt/c/Windows/Fonts/simhei.ttf",
        "/mnt/c/Windows/Fonts/msyhbd.ttc",
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc"
    ));
    if (bodyFont != null && headingFont != null) {
      return new PdfFonts(headingFont, bodyFont, true);
    }
    return new PdfFonts(
        new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD),
        new PDType1Font(Standard14Fonts.FontName.HELVETICA),
        false
    );
  }

  private PDFont loadFirstExistingFont(PDDocument document, String configuredFont, List<String> fallbackPaths)
      throws IOException {
    if (configuredFont != null && !configuredFont.isBlank()) {
      var font = new File(configuredFont);
      if (font.isFile()) {
        return PDType0Font.load(document, font);
      }
    }
    for (var path : fallbackPaths) {
      var font = new File(path);
      if (font.isFile()) {
        return PDType0Font.load(document, font);
      }
    }
    return null;
  }

  private record PdfFonts(PDFont heading, PDFont body, boolean unicode) {
    String text(String value) {
      if (unicode) {
        return value;
      }
      return value.replaceAll("[^\\x00-\\x7F]", "?");
    }
  }

  private String shorten(String value, int maxLength) {
    if (value == null || value.length() <= maxLength) {
      return value == null ? "" : value;
    }
    return value.substring(0, maxLength - 3) + "...";
  }
}
