package com.trainmark.ocr;

import com.trainmark.shared.OcrJobStatus;
import com.trainmark.shared.dto.CreateOcrJobRequest;
import com.trainmark.shared.dto.OcrBlockSummary;
import com.trainmark.shared.dto.OcrJobSummary;
import com.trainmark.shared.dto.OcrResultSummary;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class OcrService {
  private final AtomicLong jobIds = new AtomicLong(2);
  private final Map<Long, OcrJobSummary> jobs = new LinkedHashMap<>();
  private final Map<Long, OcrResultSummary> results = new LinkedHashMap<>();

  public OcrService() {
    jobs.put(1L, new OcrJobSummary(
        1L,
        1L,
        "assignments/1/students/2/report.pdf",
        OcrJobStatus.STRUCTURING,
        18,
        142,
        6,
        93,
        OffsetDateTime.now().minusMinutes(12)
    ));
    results.put(1L, new OcrResultSummary(
        1L,
        1L,
        "本文档包含需求分析、系统设计、数据库设计、功能实现和实训总结等章节。",
        List.of(
            new OcrBlockSummary("heading", "需求分析", 2, 96),
            new OcrBlockSummary("table", "数据库表结构", 7, 91),
            new OcrBlockSummary("image", "系统运行截图", 12, 88)
        )
    ));
  }

  public Collection<OcrJobSummary> listJobs(Long submissionId) {
    return jobs.values().stream()
        .filter(item -> submissionId == null || submissionId.equals(item.submissionId()))
        .toList();
  }

  public OcrJobSummary createJob(CreateOcrJobRequest request) {
    var id = jobIds.getAndIncrement();
    var blocks = inferBlocks(request.objectKey());
    var confidence = blocks.stream().mapToInt(OcrBlockSummary::confidence).sum() / blocks.size();
    var job = new OcrJobSummary(
        id,
        request.submissionId(),
        request.objectKey(),
        OcrJobStatus.COMPLETED,
        Math.max(3, blocks.stream().mapToInt(OcrBlockSummary::page).max().orElse(1)),
        blocks.size() * 28,
        (int) blocks.stream().filter(block -> "table".equals(block.type())).count(),
        confidence,
        OffsetDateTime.now()
    );
    jobs.put(id, job);
    results.put(id, new OcrResultSummary(
        id,
        request.submissionId(),
        buildPlainTextPreview(blocks),
        blocks
    ));
    return job;
  }

  public OcrResultSummary result(Long jobId) {
    var result = results.get(jobId);
    if (result == null) {
      throw new IllegalArgumentException("OCR job not found: " + jobId);
    }
    return result;
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
