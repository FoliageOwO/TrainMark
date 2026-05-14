package com.trainmark.ocr;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.CreateOcrJobRequest;
import com.trainmark.shared.dto.OcrJobSummary;
import com.trainmark.shared.dto.OcrResultSummary;
import jakarta.validation.Valid;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ocr/jobs")
public class OcrController {
  private final OcrService ocrService;

  public OcrController(OcrService ocrService) {
    this.ocrService = ocrService;
  }

  @GetMapping
  public ApiResponse<Collection<OcrJobSummary>> list(
      @RequestParam(name = "submissionId", required = false) Long submissionId
  ) {
    return ApiResponse.ok(ocrService.listJobs(submissionId));
  }

  @PostMapping
  public ApiResponse<OcrJobSummary> create(@Valid @RequestBody CreateOcrJobRequest request) {
    return ApiResponse.ok(ocrService.createJob(request));
  }

  @GetMapping("/{jobId}/result")
  public ApiResponse<OcrResultSummary> result(@PathVariable("jobId") Long jobId) {
    return ApiResponse.ok(ocrService.result(jobId));
  }
}
