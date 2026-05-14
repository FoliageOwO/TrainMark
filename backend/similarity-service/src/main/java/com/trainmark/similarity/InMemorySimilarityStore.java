package com.trainmark.similarity;

import com.trainmark.shared.SimilarityJobStatus;
import com.trainmark.shared.dto.CreateSimilarityJobRequest;
import com.trainmark.shared.dto.SimilarityJobSummary;
import com.trainmark.shared.dto.SimilarityMatchSummary;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.similarity.store", havingValue = "memory", matchIfMissing = true)
public class InMemorySimilarityStore implements SimilarityStore {
  private final AtomicLong jobIds = new AtomicLong(2);
  private final Map<Long, SimilarityJobSummary> jobs = new LinkedHashMap<>();

  public InMemorySimilarityStore() {
    jobs.put(1L, new SimilarityJobSummary(
        1L,
        1L,
        65,
        SimilarityJobStatus.COMPLETED,
        0.82,
        1,
        OffsetDateTime.now().minusHours(1),
        List.of(
            new SimilarityMatchSummary(1L, 18L, "张三", "钱雨", 0.82, "系统实现-上传流程", "HIGH"),
            new SimilarityMatchSummary(7L, 23L, "李四", "孙可", 0.68, "数据库表结构说明", "MEDIUM")
        )
    ));
  }

  @Override
  public Collection<SimilarityJobSummary> listJobs(Long assignmentId) {
    return jobs.values().stream()
        .filter(item -> assignmentId == null || assignmentId.equals(item.assignmentId()))
        .toList();
  }

  @Override
  public SimilarityJobSummary createJob(CreateSimilarityJobRequest request) {
    var id = jobIds.getAndIncrement();
    var matches = request.submissionIds().size() < 2 ? List.<SimilarityMatchSummary>of() : List.of(
        new SimilarityMatchSummary(
            request.submissionIds().get(0),
            request.submissionIds().get(1),
            "待检测学生A",
            "待检测学生B",
            request.includeHistory() ? 0.74 : 0.61,
            "需求分析章节",
            request.includeHistory() ? "MEDIUM" : "LOW"
        )
    );
    var job = new SimilarityJobSummary(
        id,
        request.assignmentId(),
        request.submissionIds().size(),
        SimilarityJobStatus.COMPLETED,
        matches.stream().mapToDouble(SimilarityMatchSummary::similarity).max().orElse(0),
        (int) matches.stream().filter(item -> "HIGH".equals(item.riskLevel())).count(),
        OffsetDateTime.now(),
        matches
    );
    jobs.put(id, job);
    return job;
  }

  @Override
  public SimilarityJobSummary getJob(Long jobId) {
    var job = jobs.get(jobId);
    if (job == null) {
      throw new IllegalArgumentException("Similarity job not found: " + jobId);
    }
    return job;
  }
}
