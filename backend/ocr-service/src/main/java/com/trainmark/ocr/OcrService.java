package com.trainmark.ocr;

import com.trainmark.shared.dto.CreateOcrJobRequest;
import com.trainmark.shared.dto.OcrJobSummary;
import com.trainmark.shared.dto.OcrResultSummary;
import java.util.Collection;
import org.springframework.stereotype.Service;

@Service
public class OcrService {
  private final OcrStore store;

  public OcrService(OcrStore store) {
    this.store = store;
  }

  public Collection<OcrJobSummary> listJobs(Long submissionId) {
    return store.listJobs(submissionId);
  }

  public OcrJobSummary createJob(CreateOcrJobRequest request) {
    return store.createJob(request);
  }

  public OcrResultSummary result(Long jobId) {
    return store.result(jobId);
  }
}
