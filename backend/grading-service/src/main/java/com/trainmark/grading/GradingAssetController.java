package com.trainmark.grading;

import com.trainmark.shared.AuthenticatedUser;
import com.trainmark.shared.PublicationStatus;
import com.trainmark.shared.ReviewStatus;
import com.trainmark.shared.TrainMarkAccessDeniedException;
import com.trainmark.shared.dto.GradingResultSummary;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GradingAssetController {
  private final GradingService gradingService;

  public GradingAssetController(GradingService gradingService) {
    this.gradingService = gradingService;
  }

  @GetMapping(value = "/annotations/submissions/{submissionId}/annotated.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
  public ResponseEntity<byte[]> annotationPdf(
      @PathVariable("submissionId") Long submissionId,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    var fileName = "批注报告-%d.pdf".formatted(submissionId);
    var result = gradingService.findResultBySubmission(submissionId);
    var currentUser = currentUser(userId, username, roles);
    if (result.isEmpty() && currentUser.isStudent()) {
      throw new TrainMarkAccessDeniedException("Students can only access published annotations");
    }
    result.ifPresent(item -> requireAnnotationVisible(currentUser, item));
    return binary(fileName, MediaType.APPLICATION_PDF, pdfBytes(result.orElse(null)));
  }

  @GetMapping(value = "/exports/assignments/{assignmentId}/{fileName:.+}")
  public ResponseEntity<byte[]> exportFile(
      @PathVariable("assignmentId") Long assignmentId,
      @PathVariable("fileName") String fileName,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    currentUser(userId, username, roles).requireStaff();
    if (fileName.toLowerCase().endsWith(".pdf")) {
      return binary("成绩导出说明.pdf", MediaType.APPLICATION_PDF, pdfBytes(null));
    }
    if (fileName.toLowerCase().endsWith(".zip")) {
      return binary("成绩与批注.zip", MediaType.parseMediaType("application/zip"), zipBytes(assignmentId));
    }
    return binary("成绩单.csv", MediaType.parseMediaType("text/csv;charset=UTF-8"), csvBytes(assignmentId));
  }

  private AuthenticatedUser currentUser(String userId, String username, String roles) {
    return AuthenticatedUser.fromHeaders(userId, username, roles);
  }

  private void requireAnnotationVisible(AuthenticatedUser currentUser, GradingResultSummary result) {
    if (!currentUser.isStudent()) {
      return;
    }
    currentUser.requireStudentOwner(result.studentId());
    if (result.publicationStatus() != PublicationStatus.PUBLISHED) {
      throw new TrainMarkAccessDeniedException("Students can only access published annotations");
    }
  }

  private ResponseEntity<byte[]> binary(String fileName, MediaType mediaType, byte[] body) {
    return ResponseEntity.ok()
        .contentType(mediaType)
        .contentLength(body.length)
        .header(HttpHeaders.CONTENT_DISPOSITION,
            ContentDisposition.attachment().filename(fileName, StandardCharsets.UTF_8).build().toString())
        .body(body);
  }

  private byte[] csvBytes(Long assignmentId) {
    var csv = new StringBuilder("\uFEFF作业ID,学号,姓名,教师分,总分,复核状态,发布状态\n");
    gradingService.listResults(assignmentId, null).stream()
        .filter(result -> result.publicationStatus() == PublicationStatus.PUBLISHED)
        .forEach(result -> csv.append(assignmentId).append(',')
            .append(csvCell(result.studentNo())).append(',')
            .append(csvCell(result.studentName())).append(',')
            .append(result.teacherScore()).append(',')
            .append(result.totalScore()).append(',')
            .append(csvCell(reviewStatusLabel(result.reviewStatus()))).append(',')
            .append(csvCell(publicationStatusLabel(result.publicationStatus()))).append('\n'));
    return csv.toString().getBytes(StandardCharsets.UTF_8);
  }

  private byte[] zipBytes(Long assignmentId) {
    try {
      var output = new ByteArrayOutputStream();
      try (var zip = new ZipOutputStream(output, StandardCharsets.UTF_8)) {
        zip.putNextEntry(new ZipEntry("成绩单.csv"));
        zip.write(csvBytes(assignmentId));
        zip.closeEntry();
        var results = gradingService.listResults(assignmentId, null);
        for (var result : results) {
          zip.putNextEntry(new ZipEntry("批注报告/批注报告-%d.pdf".formatted(result.submissionId())));
          zip.write(pdfBytes(result));
          zip.closeEntry();
        }
        zip.putNextEntry(new ZipEntry("说明.txt"));
        zip.write(zipReadme(assignmentId, results.size()).getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
      }
      return output.toByteArray();
    } catch (IOException exception) {
      throw new IllegalStateException("Failed to build grade export zip", exception);
    }
  }

  private String zipReadme(Long assignmentId, int annotationCount) {
    return "智能批改成绩导出包\n"
        + "作业 ID: " + assignmentId + "\n"
        + "包含批注 PDF: " + annotationCount + " 份\n";
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
      if (fonts == null) {
        throw new IllegalStateException("生成中文批注报告失败：未找到可用中文字体");
      }

      try (var contentStream = new PDPageContentStream(document, page)) {
        // Title
        contentStream.beginText();
        contentStream.setFont(fonts.heading(), 18);
        contentStream.newLineAtOffset(margin, y);
        contentStream.showText(fonts.text("智能批改批注报告"));
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
              "复核状态: " + reviewStatusLabel(result.reviewStatus()),
              "发布状态: " + publicationStatusLabel(result.publicationStatus()),
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
                    .map(a -> "[" + severityLabel(a.severity()) + "] 第" + a.page() + "页 - " + a.comment())
                    .toList());
          }
        }
      }

      var output = new ByteArrayOutputStream();
      document.save(output);
      return output.toByteArray();
    } catch (IOException exception) {
      throw new IllegalStateException("生成中文批注报告失败", exception);
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
      var wrapped = wrapText(fonts.body(), 10, item, width - 24);
      for (var lineIndex = 0; lineIndex < wrapped.size(); lineIndex++) {
        if (y < margin + 30) {
          return y;
        }
        cs.beginText();
        cs.setFont(fonts.body(), 10);
        cs.newLineAtOffset(margin + 8, y);
        cs.showText(fonts.text((lineIndex == 0 ? "- " : "  ") + wrapped.get(lineIndex)));
        cs.endText();
        y -= 14;
      }
      y -= 2;
    }

    return y - gap;
  }

  private List<String> wrapText(PDFont font, float fontSize, String value, float maxWidth) throws IOException {
    value = PdfFonts.normalize(value);
    if (value == null || value.isBlank()) {
      return List.of("");
    }
    var lines = new ArrayList<String>();
    var current = new StringBuilder();
    for (var offset = 0; offset < value.length(); ) {
      var codePoint = value.codePointAt(offset);
      var next = current.toString() + new String(Character.toChars(codePoint));
      if (!current.isEmpty() && textWidth(font, fontSize, next) > maxWidth) {
        lines.add(current.toString());
        current.setLength(0);
      }
      current.appendCodePoint(codePoint);
      offset += Character.charCount(codePoint);
    }
    if (!current.isEmpty()) {
      lines.add(current.toString());
    }
    return lines;
  }

  private float textWidth(PDFont font, float fontSize, String value) throws IOException {
    return font.getStringWidth(PdfFonts.normalize(value)) / 1000f * fontSize;
  }

  private PdfFonts loadFonts(PDDocument document) {
    var configuredFont = System.getenv("ANNOTATION_PDF_FONT_PATH");
    var bodyFont = loadFirstExistingFont(document, configuredFont, List.of(
        "C:/Windows/Fonts/NotoSansSC-VF.ttf",
        "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/simhei.ttf",
        "C:/Windows/Fonts/simsun.ttc",
        "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
        "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc"
    ));
    var headingFont = loadFirstExistingFont(document, configuredFont, List.of(
        "C:/Windows/Fonts/NotoSansSC-VF.ttf",
        "C:/Windows/Fonts/msyhbd.ttc",
        "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/simhei.ttf",
        "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
        "/usr/share/fonts/noto-cjk/NotoSansCJK-Bold.ttc",
        "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc"
    ));
    if (bodyFont != null && headingFont != null) {
      return new PdfFonts(headingFont, bodyFont);
    }
    return null;
  }

  private PDFont loadFirstExistingFont(PDDocument document, String configuredFont, List<String> fallbackPaths) {
    if (configuredFont != null && !configuredFont.isBlank()) {
      var font = new File(configuredFont);
      if (font.isFile()) {
        var loaded = loadFont(document, font);
        if (loaded != null) {
          return loaded;
        }
      }
    }
    for (var path : fallbackPaths) {
      var font = new File(path);
      if (font.isFile()) {
        var loaded = loadFont(document, font);
        if (loaded != null) {
          return loaded;
        }
      }
    }
    return null;
  }

  private PDFont loadFont(PDDocument document, File font) {
    try {
      return PDType0Font.load(document, font);
    } catch (IOException exception) {
      return null;
    }
  }

  private String csvCell(String value) {
    var safe = value == null ? "" : value;
    if (safe.contains(",") || safe.contains("\"") || safe.contains("\n") || safe.contains("\r")) {
      return "\"" + safe.replace("\"", "\"\"") + "\"";
    }
    return safe;
  }

  private String reviewStatusLabel(ReviewStatus status) {
    return switch (status) {
      case NEEDS_REVIEW -> "待复核";
      case IN_REVIEW -> "复核中";
      case APPROVED -> "已通过";
      case RETURNED -> "已退回";
    };
  }

  private String publicationStatusLabel(PublicationStatus status) {
    return switch (status) {
      case NOT_PUBLISHED -> "未发布";
      case PUBLISHED -> "已发布";
      case WITHDRAWN -> "已撤回";
    };
  }

  private String severityLabel(String severity) {
    if (severity == null) {
      return "提示";
    }
    return switch (severity.toLowerCase()) {
      case "warning" -> "需关注";
      case "error" -> "严重";
      default -> "提示";
    };
  }

  private record PdfFonts(PDFont heading, PDFont body) {
    String text(String value) {
      return normalize(value);
    }

    static String normalize(String value) {
      if (value == null || value.isEmpty()) {
        return value == null ? "" : value;
      }
      var builder = new StringBuilder(value.length());
      for (var index = 0; index < value.length(); index += 1) {
        var character = value.charAt(index);
        if (character >= '!' && character <= '~') {
          builder.append((char) (character - '!' + '！'));
          continue;
        }
        builder.append(character);
      }
      return builder.toString();
    }
  }

  private String shorten(String value, int maxLength) {
    if (value == null || value.length() <= maxLength) {
      return value == null ? "" : value;
    }
    return value.substring(0, maxLength - 3) + "...";
  }
}
