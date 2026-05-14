package com.trainmark.similarity;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.CreateSimilarityJobRequest;
import com.trainmark.shared.dto.SimilarityJobSummary;
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
@RequestMapping("/api/similarity/jobs")
public class SimilarityController {
  private final SimilarityService similarityService;

  public SimilarityController(SimilarityService similarityService) {
    this.similarityService = similarityService;
  }

  @GetMapping
  public ApiResponse<Collection<SimilarityJobSummary>> list(
      @RequestParam(name = "assignmentId", required = false) Long assignmentId
  ) {
    return ApiResponse.ok(similarityService.listJobs(assignmentId));
  }

  @PostMapping
  public ApiResponse<SimilarityJobSummary> create(@Valid @RequestBody CreateSimilarityJobRequest request) {
    return ApiResponse.ok(similarityService.createJob(request));
  }

  @GetMapping("/{jobId}")
  public ApiResponse<SimilarityJobSummary> get(@PathVariable("jobId") Long jobId) {
    return ApiResponse.ok(similarityService.getJob(jobId));
  }
}
