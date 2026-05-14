package com.trainmark.ocr;

import com.trainmark.shared.dto.CreateOcrJobRequest;
import java.util.Locale;

public class LocalDocumentPreprocessor implements DocumentPreprocessor {
  @Override
  public DocumentPreprocessResult preprocess(CreateOcrJobRequest request) {
    var objectKey = request.objectKey();
    var sourceFormat = sourceFormat(objectKey);
    var targetFormat = "IMAGE".equals(sourceFormat) ? "IMAGE" : "PDF";
    var normalizedObjectKey = normalizedObjectKey(objectKey, sourceFormat);
    return new DocumentPreprocessResult(
        objectKey,
        normalizedObjectKey,
        sourceFormat,
        targetFormat,
        inferredPageCount(objectKey, sourceFormat),
        inferredImageCount(objectKey, sourceFormat),
        inferredTableHintCount(objectKey)
    );
  }

  private String sourceFormat(String objectKey) {
    var normalized = objectKey.toLowerCase(Locale.ROOT);
    if (normalized.endsWith(".pdf")) {
      return "PDF";
    }
    if (normalized.endsWith(".doc") || normalized.endsWith(".docx")) {
      return "WORD";
    }
    if (normalized.endsWith(".png") || normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
      return "IMAGE";
    }
    return "UNKNOWN";
  }

  private String normalizedObjectKey(String objectKey, String sourceFormat) {
    if ("PDF".equals(sourceFormat) || "IMAGE".equals(sourceFormat)) {
      return objectKey;
    }
    var withoutExtension = objectKey.replaceFirst("(?i)\\.(docx?|pdf|png|jpe?g)$", "");
    return "converted/" + withoutExtension + ".pdf";
  }

  private int inferredPageCount(String objectKey, String sourceFormat) {
    if ("IMAGE".equals(sourceFormat)) {
      return 1;
    }
    var normalized = objectKey.toLowerCase(Locale.ROOT);
    if (normalized.contains("database") || normalized.contains("数据库")) {
      return 8;
    }
    if ("WORD".equals(sourceFormat)) {
      return 12;
    }
    return 18;
  }

  private int inferredImageCount(String objectKey, String sourceFormat) {
    if ("IMAGE".equals(sourceFormat)) {
      return 1;
    }
    var normalized = objectKey.toLowerCase(Locale.ROOT);
    return normalized.contains("screenshot") || normalized.contains("截图") ? 4 : 2;
  }

  private int inferredTableHintCount(String objectKey) {
    var normalized = objectKey.toLowerCase(Locale.ROOT);
    return normalized.contains("database") || normalized.contains("数据库") ? 3 : 1;
  }
}
