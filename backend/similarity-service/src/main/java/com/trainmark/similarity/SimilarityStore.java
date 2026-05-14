package com.trainmark.similarity;

import com.trainmark.shared.dto.CreateSimilarityJobRequest;
import com.trainmark.shared.dto.SimilarityJobSummary;
import java.util.Collection;

public interface SimilarityStore {
  Collection<SimilarityJobSummary> listJobs(Long assignmentId);

  SimilarityJobSummary createJob(CreateSimilarityJobRequest request);

  SimilarityJobSummary getJob(Long jobId);
}
