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
  }

  public Collection<OcrJobSummary> listJobs(Long submissionId) {
    return jobs.values().stream()
        .filter(item -> submissionId == null || submissionId.equals(item.submissionId()))
        .toList();
  }

  public OcrJobSummary createJob(CreateOcrJobRequest request) {
    var id = jobIds.getAndIncrement();
    var job = new OcrJobSummary(
        id,
        request.submissionId(),
        request.objectKey(),
        OcrJobStatus.PENDING,
        0,
        0,
        0,
        0,
        OffsetDateTime.now()
    );
    jobs.put(id, job);
    return job;
  }

  public OcrResultSummary result(Long jobId) {
    var job = jobs.get(jobId);
    if (job == null) {
      throw new IllegalArgumentException("OCR job not found: " + jobId);
    }
    return new OcrResultSummary(
        jobId,
        job.submissionId(),
        "本文档包含需求分析、系统设计、数据库设计、功能实现和实训总结等章节。",
        List.of(
            new OcrBlockSummary("heading", "需求分析", 2, 96),
            new OcrBlockSummary("table", "数据库表结构", 7, 91),
            new OcrBlockSummary("image", "系统运行截图", 12, 88)
        )
    );
  }
}
