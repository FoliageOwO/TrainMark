package com.trainmark.ocr;

import com.trainmark.shared.dto.CreateOcrJobRequest;

public interface DocumentPreprocessor {
  DocumentPreprocessResult preprocess(CreateOcrJobRequest request);
}
