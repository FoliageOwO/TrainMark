package com.trainmark.grading;

import com.trainmark.shared.GradingJobStatus;
import com.trainmark.shared.dto.CreateGradingJobRequest;
import com.trainmark.shared.dto.GradingJobSummary;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.grading.job-store", havingValue = "memory", matchIfMissing = true)
public class InMemoryGradingJobStore implements GradingJobStore {
  private final AtomicLong jobIds = new AtomicLong(2);
  private final Map<Long, GradingJobSummary> jobs = new LinkedHashMap<>();

  public InMemoryGradingJobStore() {
    jobs.put(1L, new GradingJobSummary(
        1L,
        1L,
        1L,
        65,
        47,
        GradingJobStatus.SCORING,
        86,
        OffsetDateTime.now().minusMinutes(18)
    ));
  }

  @Override
  public Collection<GradingJobSummary> listJobs(Long assignmentId) {
    return jobs.values().stream()
        .filter(item -> assignmentId == null || assignmentId.equals(item.assignmentId()))
        .toList();
  }

  @Override
  public GradingJobSummary createJob(CreateGradingJobRequest request) {
    var id = jobIds.getAndIncrement();
    var job = new GradingJobSummary(
        id,
        request.assignmentId(),
        request.rubricId(),
        request.submissionIds().size(),
        request.submissionIds().size(),
        GradingJobStatus.COMPLETED,
        86,
        OffsetDateTime.now()
    );
    jobs.put(id, job);
    return job;
  }
}
