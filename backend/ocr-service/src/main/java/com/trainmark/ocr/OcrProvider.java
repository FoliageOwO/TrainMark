package com.trainmark.ocr;

import com.trainmark.shared.dto.CreateOcrJobRequest;
import com.trainmark.shared.dto.OcrResultSummary;

public interface OcrProvider {
  OcrResultSummary recognize(Long jobId, CreateOcrJobRequest request);
}
