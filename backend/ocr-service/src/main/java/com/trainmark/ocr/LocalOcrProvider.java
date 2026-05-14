package com.trainmark.ocr;

import com.trainmark.shared.dto.CreateOcrJobRequest;
import com.trainmark.shared.dto.OcrBlockSummary;
import com.trainmark.shared.dto.OcrResultSummary;
import java.util.List;

public class LocalOcrProvider implements OcrProvider {
  @Override
  public OcrResultSummary recognize(Long jobId, CreateOcrJobRequest request) {
    var blocks = inferBlocks(request.objectKey());
    return new OcrResultSummary(
        jobId,
        request.submissionId(),
        buildPlainTextPreview(blocks),
        blocks
    );
  }

  private List<OcrBlockSummary> inferBlocks(String objectKey) {
    var normalized = objectKey.toLowerCase();
    if (normalized.contains("database") || normalized.contains("数据库")) {
      return List.of(
          new OcrBlockSummary("heading", "数据库概念结构设计", 1, 95),
          new OcrBlockSummary("table", "ER 实体关系表", 3, 92),
          new OcrBlockSummary("table", "数据字典", 5, 90),
          new OcrBlockSummary("paragraph", "规范化分析", 7, 88)
      );
    }
    if (normalized.endsWith(".png") || normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
      return List.of(
          new OcrBlockSummary("image", "系统截图", 1, 89),
          new OcrBlockSummary("paragraph", "截图文字说明", 1, 84)
      );
    }
    return List.of(
        new OcrBlockSummary("heading", "需求分析", 2, 96),
        new OcrBlockSummary("table", "数据库表结构", 7, 91),
        new OcrBlockSummary("image", "系统运行截图", 12, 88),
        new OcrBlockSummary("heading", "实训总结", 17, 90)
    );
  }

  private String buildPlainTextPreview(List<OcrBlockSummary> blocks) {
    return "识别到 " + blocks.stream()
        .map(OcrBlockSummary::title)
        .reduce((left, right) -> left + "、" + right)
        .orElse("文档内容") + " 等结构化内容。";
  }
}
