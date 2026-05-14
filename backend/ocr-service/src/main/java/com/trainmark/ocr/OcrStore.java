package com.trainmark.ocr;

import com.trainmark.shared.dto.CreateOcrJobRequest;
import com.trainmark.shared.dto.OcrJobSummary;
import com.trainmark.shared.dto.OcrResultSummary;
import java.util.Collection;

public interface OcrStore {
  Collection<OcrJobSummary> listJobs(Long submissionId);

  OcrJobSummary createJob(CreateOcrJobRequest request);

  OcrResultSummary result(Long jobId);
}
