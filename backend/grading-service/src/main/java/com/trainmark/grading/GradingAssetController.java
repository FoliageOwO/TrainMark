package com.trainmark.grading;

import com.trainmark.shared.AuthenticatedUser;
import com.trainmark.shared.PublicationStatus;
import com.trainmark.shared.ReviewStatus;
import com.trainmark.shared.TrainMarkAccessDeniedException;
import com.trainmark.shared.dto.GradingResultSummary;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.apache.pdfbox.Loader;
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
  private final Path uploadObjectRoot;

  public GradingAssetController(
      GradingService gradingService,
      @org.springframework.beans.factory.annotation.Value("${trainmark.upload.object-root:${UPLOAD_OBJECT_ROOT:.data/uploads}}") String uploadObjectRoot
  ) {
    this.gradingService = gradingService;
    this.uploadObjectRoot = Path.of(uploadObjectRoot).toAbsolutePath().normalize();
  }

  @GetMapping(value = "/annotations/submissions/{submissionId}/annotated.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
  public ResponseEntity<byte[]> annotationPdf(
      @PathVariable("submissionId") Long submissionId,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    var result = gradingService.findResultBySubmission(submissionId);
    var currentUser = currentUser(userId, username, roles);
    if (result.isEmpty() && currentUser.isStudent()) {
      throw new TrainMarkAccessDeniedException("Students can only access published annotations");
    }
    result.ifPresent(item -> requireAnnotationVisible(currentUser, item));
    var fileName = result.map(this::annotationFileName).orElse("批注报告-%d.pdf".formatted(submissionId));
    return binary(fileName, MediaType.APPLICATION_PDF, annotatedPdfBytes(submissionId, result.orElse(null)));
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
      return binary("成绩导出说明.pdf", MediaType.APPLICATION_PDF, annotatedPdfBytes(null, null));
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
        var entryNames = new HashSet<String>();
        for (var result : results) {
          zip.putNextEntry(new ZipEntry("批注报告/" + uniqueZipEntryName(entryNames, annotationFileName(result))));
          zip.write(annotatedPdfBytes(result.submissionId(), result));
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
   * Generates a PDF annotation version. If the original uploaded PDF is available locally,
   * the annotation page is appended to it; otherwise a readable standalone annotation PDF is generated.
   */
  private byte[] annotatedPdfBytes(Long submissionId, GradingResultSummary result) {
    var originalPdf = originalSubmissionPdf(submissionId);
    if (originalPdf != null && result != null) {
      try (var document = Loader.loadPDF(originalPdf)) {
        appendAnnotationPage(document, result, true);
        var output = new ByteArrayOutputStream();
        document.save(output);
        return output.toByteArray();
      } catch (IOException | RuntimeException ignored) {
        // Fall back to a standalone annotation PDF when the uploaded file is not a valid readable PDF.
      }
    }

    try (var document = new PDDocument()) {
      appendAnnotationPage(document, result, false);
      var output = new ByteArrayOutputStream();
      document.save(output);
      return output.toByteArray();
    } catch (IOException exception) {
      throw new IllegalStateException("生成中文批注报告失败", exception);
    }
  }

  private void appendAnnotationPage(PDDocument document, GradingResultSummary result, boolean appendedToOriginal) throws IOException {
    var page = new PDPage(PDRectangle.A4);
    document.addPage(page);

    var margin = 56f;
    var pageWidth = page.getMediaBox().getWidth();
    var y = page.getMediaBox().getUpperRightY() - margin;
    var contentWidth = pageWidth - 2 * margin;
    var fonts = loadFonts(document);
    if (fonts == null) {
      throw new IllegalStateException("生成中文批注报告失败：未找到可用中文字体");
    }

    try (var contentStream = new PDPageContentStream(document, page)) {
      setFillColor(contentStream, 37, 99, 235);
      contentStream.addRect(0, page.getMediaBox().getUpperRightY() - 92, pageWidth, 92);
      contentStream.fill();

      contentStream.beginText();
      setFillColor(contentStream, 255, 255, 255);
      contentStream.setFont(fonts.heading(), 18);
      contentStream.newLineAtOffset(margin, y);
      contentStream.showText(fonts.text(appendedToOriginal ? "学生原报告批注页" : "学生原报告批注版"));
      contentStream.endText();
      y -= 26;

      contentStream.beginText();
      contentStream.setFont(fonts.body(), 10);
      contentStream.newLineAtOffset(margin, y);
      contentStream.showText(fonts.text(appendedToOriginal ? "已保留学生提交的原始 PDF 页面，以下为教师复核与系统批注。" : "未读取到可合并的原始 PDF，以下保留原报告信息与批注内容。"));
      contentStream.endText();
      y -= 44;
      setFillColor(contentStream, 17, 24, 39);

      if (result == null) {
        drawSection(contentStream, fonts, margin, y, contentWidth, "批注信息", List.of("暂无批改结果"));
        return;
      }

      y = drawSection(contentStream, fonts, margin, y, contentWidth, "原报告信息", List.of(
          "文件: " + result.fileName(),
          "学生: " + result.studentName() + " (" + result.studentNo() + ")",
          "提交编号: " + result.submissionId()
      ));

      y = drawSection(contentStream, fonts, margin, y, contentWidth, "成绩总览", List.of(
          "教师复核: " + result.teacherScore() + " / " + result.totalScore(),
          "AI 初评: " + result.aiScore() + " / " + result.totalScore(),
          "复核状态: " + reviewStatusLabel(result.reviewStatus()),
          "发布状态: " + publicationStatusLabel(result.publicationStatus()),
          "置信度: " + result.confidence() + "%"
      ));

      if (result.overallComment() != null && !result.overallComment().isBlank()) {
        y = drawSection(contentStream, fonts, margin, y, contentWidth, "教师总评", List.of(result.overallComment()));
      }

      y = drawSection(contentStream, fonts, margin, y, contentWidth, "分项复核",
          result.items().stream()
              .map(item -> item.title() + ": " + item.teacherScore() + "/" + item.maxScore()
                  + "；教师评语: " + blankToDefault(item.teacherComment(), "暂无")
                  + "；扣分原因: " + blankToDefault(item.deductionReason(), "暂无"))
              .toList());

      if (!result.annotations().isEmpty()) {
        drawColoredAnnotations(contentStream, fonts, margin, y, contentWidth, result.annotations());
      }
    }
  }

  private byte[] originalSubmissionPdf(Long submissionId) {
    if (submissionId == null) {
      return null;
    }
    var reference = gradingService.findSubmissionFileReference(submissionId);
    if (reference.isEmpty()) {
      return null;
    }
    var fileName = reference.get().fileName();
    var objectKey = reference.get().objectKey();
    if (fileName == null || !fileName.toLowerCase().endsWith(".pdf") || objectKey == null || objectKey.isBlank()) {
      return null;
    }
    var target = uploadObjectRoot.resolve(objectKey).normalize();
    if (!target.startsWith(uploadObjectRoot) || !Files.isRegularFile(target)) {
      return null;
    }
    try {
      return Files.readAllBytes(target);
    } catch (IOException error) {
      return null;
    }
  }

  private float drawColoredAnnotations(
      PDPageContentStream cs,
      PdfFonts fonts,
      float margin,
      float y,
      float width,
      List<com.trainmark.shared.dto.GradingAnnotationSummary> annotations
  ) throws IOException {
    if (y < margin + 90) {
      return y;
    }
    cs.beginText();
    setFillColor(cs, 17, 24, 39);
    cs.setFont(fonts.heading(), 14);
    cs.newLineAtOffset(margin, y);
    cs.showText(fonts.text("报告批注"));
    cs.endText();
    y -= 22;

    for (var annotation : annotations.stream().limit(12).toList()) {
      if (y < margin + 50) {
        return y;
      }
      setAnnotationFill(cs, annotation.severity());
      cs.addRect(margin, y - 34, width, 42);
      cs.fill();
      setFillColor(cs, 17, 24, 39);
      cs.beginText();
      cs.setFont(fonts.body(), 10);
      cs.newLineAtOffset(margin + 10, y - 6);
      cs.showText(fonts.text("第 " + annotation.page() + " 页 · " + annotation.anchorText() + " · " + severityLabel(annotation.severity())));
      cs.endText();
      var wrapped = wrapText(fonts.body(), 9, annotation.comment(), width - 20);
      if (!wrapped.isEmpty()) {
        cs.beginText();
        cs.setFont(fonts.body(), 9);
        cs.newLineAtOffset(margin + 10, y - 21);
        cs.showText(fonts.text(wrapped.get(0)));
        cs.endText();
      }
      y -= 50;
    }
    setFillColor(cs, 17, 24, 39);
    return y;
  }

  private void setAnnotationFill(PDPageContentStream cs, String severity) throws IOException {
    if (severity == null) {
      setFillColor(cs, 239, 246, 255);
      return;
    }
    switch (severity.toLowerCase()) {
      case "warning" -> setFillColor(cs, 255, 247, 237);
      case "error" -> setFillColor(cs, 254, 242, 242);
      default -> setFillColor(cs, 239, 246, 255);
    }
  }

  private void setFillColor(PDPageContentStream cs, int red, int green, int blue) throws IOException {
    cs.setNonStrokingColor(
        red / 255f,
        green / 255f,
        blue / 255f
    );
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

  private String annotationFileName(GradingResultSummary result) {
    var baseName = result.fileName() == null || result.fileName().isBlank()
        ? result.studentName() + "-自动批改报告"
        : result.fileName().replaceFirst("\\.[^.]+$", "");
    return safeFileName(baseName + "-批注.pdf");
  }

  private String safeFileName(String value) {
    return value.replaceAll("[\\\\/:*?\"<>|]", "_");
  }

  private String uniqueZipEntryName(HashSet<String> entryNames, String fileName) {
    if (entryNames.add(fileName)) {
      return fileName;
    }
    var extensionIndex = fileName.lastIndexOf('.');
    var baseName = extensionIndex > 0 ? fileName.substring(0, extensionIndex) : fileName;
    var extension = extensionIndex > 0 ? fileName.substring(extensionIndex) : "";
    var index = 2;
    while (true) {
      var candidate = baseName + "-" + index + extension;
      if (entryNames.add(candidate)) {
        return candidate;
      }
      index += 1;
    }
  }

  private String blankToDefault(String value, String defaultValue) {
    return value == null || value.isBlank() ? defaultValue : value;
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
