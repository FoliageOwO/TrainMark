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
  private final OcrProvider ocrProvider;
  private final AtomicLong jobIds = new AtomicLong(2);
  private final Map<Long, OcrJobSummary> jobs = new LinkedHashMap<>();
  private final Map<Long, OcrResultSummary> results = new LinkedHashMap<>();

  public OcrService(OcrProvider ocrProvider) {
    this.ocrProvider = ocrProvider;
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
    var result = ocrProvider.recognize(id, request);
    var blocks = result.blocks();
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
    results.put(id, result);
    return job;
  }

  public OcrResultSummary result(Long jobId) {
    var result = results.get(jobId);
    if (result == null) {
      throw new IllegalArgumentException("OCR job not found: " + jobId);
    }
    return result;
  }
}
