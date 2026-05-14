package com.trainmark.grading;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.CreateGradingJobRequest;
import com.trainmark.shared.dto.GradingJobSummary;
import jakarta.validation.Valid;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/grading/jobs")
public class GradingJobController {
  private final GradingService gradingService;

  public GradingJobController(GradingService gradingService) {
    this.gradingService = gradingService;
  }

  @GetMapping
  public ApiResponse<Collection<GradingJobSummary>> list(
      @RequestParam(name = "assignmentId", required = false) Long assignmentId
  ) {
    return ApiResponse.ok(gradingService.listJobs(assignmentId));
  }

  @PostMapping
  public ApiResponse<GradingJobSummary> create(@Valid @RequestBody CreateGradingJobRequest request) {
    return ApiResponse.ok(gradingService.createJob(request));
  }
}
