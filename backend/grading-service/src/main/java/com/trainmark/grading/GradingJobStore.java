package com.trainmark.grading;

import com.trainmark.shared.dto.CreateGradingJobRequest;
import com.trainmark.shared.dto.GradingJobSummary;
import java.util.Collection;

public interface GradingJobStore {
  Collection<GradingJobSummary> listJobs(Long assignmentId);

  GradingJobSummary createJob(CreateGradingJobRequest request);
}
