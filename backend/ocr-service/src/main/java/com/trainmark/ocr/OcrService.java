package com.trainmark.ocr;

import com.trainmark.shared.dto.CreateOcrJobRequest;
import com.trainmark.shared.dto.OcrJobSummary;
import com.trainmark.shared.dto.OcrResultSummary;
import java.util.Collection;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class OcrService {
  private final OcrStore store;
  private final OcrJobPublisher jobPublisher;
  private final boolean asyncEnabled;

  public OcrService(
      OcrStore store,
      ObjectProvider<OcrJobPublisher> jobPublisher,
      @Value("${trainmark.ocr.async-enabled:false}") boolean asyncEnabled
  ) {
    this.store = store;
    this.jobPublisher = jobPublisher.getIfAvailable();
    this.asyncEnabled = asyncEnabled;
  }

  public Collection<OcrJobSummary> listJobs(Long submissionId) {
    return store.listJobs(submissionId);
  }

  public OcrJobSummary createJob(CreateOcrJobRequest request) {
    if (asyncEnabled) {
      var job = store.createPendingJob(request);
      if (jobPublisher == null) {
        store.failJob(job.id());
        throw new IllegalStateException("OCR async publisher is not available");
      }
      try {
        jobPublisher.publish(new OcrJobMessage(job.id(), request.submissionId(), request.objectKey(), request.mode()));
      } catch (RuntimeException error) {
        store.failJob(job.id());
        throw error;
      }
      return job;
    }
    return store.createJob(request);
  }

  public OcrResultSummary result(Long jobId) {
    return store.result(jobId);
  }
}
