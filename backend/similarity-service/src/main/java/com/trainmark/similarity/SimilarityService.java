package com.trainmark.similarity;

import com.trainmark.shared.dto.CreateSimilarityJobRequest;
import com.trainmark.shared.dto.SimilarityJobSummary;
import java.util.Collection;
import org.springframework.stereotype.Service;

@Service
public class SimilarityService {
  private final SimilarityStore store;

  public SimilarityService(SimilarityStore store) {
    this.store = store;
  }

  public Collection<SimilarityJobSummary> listJobs(Long assignmentId) {
    return store.listJobs(assignmentId);
  }

  public SimilarityJobSummary createJob(CreateSimilarityJobRequest request) {
    return store.createJob(request);
  }

  public SimilarityJobSummary getJob(Long jobId) {
    return store.getJob(jobId);
  }
}
