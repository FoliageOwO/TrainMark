package com.trainmark.grading;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.ReviewStatus;
import com.trainmark.shared.dto.GradingResultSummary;
import com.trainmark.shared.dto.ReviewDecisionRequest;
import com.trainmark.shared.dto.UpdateReviewItemRequest;
import jakarta.validation.Valid;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/grading/results")
public class GradingReviewController {
  private final GradingService gradingService;

  public GradingReviewController(GradingService gradingService) {
    this.gradingService = gradingService;
  }

  @GetMapping
  public ApiResponse<Collection<GradingResultSummary>> list(
      @RequestParam(required = false) Long assignmentId,
      @RequestParam(required = false) ReviewStatus reviewStatus
  ) {
    return ApiResponse.ok(gradingService.listResults(assignmentId, reviewStatus));
  }

  @GetMapping("/{resultId}")
  public ApiResponse<GradingResultSummary> get(@PathVariable Long resultId) {
    return ApiResponse.ok(gradingService.getResult(resultId));
  }

  @PatchMapping("/{resultId}/items")
  public ApiResponse<GradingResultSummary> updateItem(
      @PathVariable Long resultId,
      @Valid @RequestBody UpdateReviewItemRequest request
  ) {
    return ApiResponse.ok(gradingService.updateReviewItem(resultId, request));
  }

  @PostMapping("/{resultId}/approve")
  public ApiResponse<GradingResultSummary> approve(
      @PathVariable Long resultId,
      @Valid @RequestBody ReviewDecisionRequest request
  ) {
    return ApiResponse.ok(gradingService.approveResult(resultId, request));
  }
}
