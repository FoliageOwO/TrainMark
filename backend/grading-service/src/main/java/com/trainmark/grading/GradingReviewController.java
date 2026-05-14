package com.trainmark.grading;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.AppealStatus;
import com.trainmark.shared.PublicationStatus;
import com.trainmark.shared.ReviewStatus;
import com.trainmark.shared.dto.AppealSummary;
import com.trainmark.shared.dto.CreateAppealRequest;
import com.trainmark.shared.dto.GradePublicationAuditEntry;
import com.trainmark.shared.dto.GradePublicationSummary;
import com.trainmark.shared.dto.GradingResultSummary;
import com.trainmark.shared.dto.PublishGradeRequest;
import com.trainmark.shared.dto.ResolveAppealRequest;
import com.trainmark.shared.dto.ReviewDecisionRequest;
import com.trainmark.shared.dto.UpdateReviewItemRequest;
import com.trainmark.shared.dto.WithdrawGradeRequest;
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
      @RequestParam(name = "assignmentId", required = false) Long assignmentId,
      @RequestParam(name = "reviewStatus", required = false) ReviewStatus reviewStatus
  ) {
    return ApiResponse.ok(gradingService.listResults(assignmentId, reviewStatus));
  }

  @GetMapping("/{resultId}")
  public ApiResponse<GradingResultSummary> get(@PathVariable("resultId") Long resultId) {
    return ApiResponse.ok(gradingService.getResult(resultId));
  }

  @PatchMapping("/{resultId}/items")
  public ApiResponse<GradingResultSummary> updateItem(
      @PathVariable("resultId") Long resultId,
      @Valid @RequestBody UpdateReviewItemRequest request
  ) {
    return ApiResponse.ok(gradingService.updateReviewItem(resultId, request));
  }

  @PostMapping("/{resultId}/approve")
  public ApiResponse<GradingResultSummary> approve(
      @PathVariable("resultId") Long resultId,
      @Valid @RequestBody ReviewDecisionRequest request
  ) {
    return ApiResponse.ok(gradingService.approveResult(resultId, request));
  }

  @GetMapping("/publications")
  public ApiResponse<Collection<GradePublicationSummary>> listPublications(
      @RequestParam(name = "assignmentId", required = false) Long assignmentId,
      @RequestParam(name = "publicationStatus", required = false) PublicationStatus publicationStatus
  ) {
    return ApiResponse.ok(gradingService.listPublications(assignmentId, publicationStatus));
  }

  @PostMapping("/{resultId}/publish")
  public ApiResponse<GradingResultSummary> publish(
      @PathVariable("resultId") Long resultId,
      @Valid @RequestBody PublishGradeRequest request
  ) {
    return ApiResponse.ok(gradingService.publishResult(resultId, request));
  }

  @PostMapping("/{resultId}/withdraw")
  public ApiResponse<GradingResultSummary> withdraw(
      @PathVariable("resultId") Long resultId,
      @Valid @RequestBody WithdrawGradeRequest request
  ) {
    return ApiResponse.ok(gradingService.withdrawResult(resultId, request));
  }

  @GetMapping("/{resultId}/publication-audits")
  public ApiResponse<Collection<GradePublicationAuditEntry>> listPublicationAudits(@PathVariable("resultId") Long resultId) {
    return ApiResponse.ok(gradingService.listPublicationAudits(resultId));
  }

  @GetMapping("/appeals")
  public ApiResponse<Collection<AppealSummary>> listAppeals(
      @RequestParam(name = "resultId", required = false) Long resultId,
      @RequestParam(name = "studentId", required = false) Long studentId,
      @RequestParam(name = "status", required = false) AppealStatus status
  ) {
    return ApiResponse.ok(gradingService.listAppeals(resultId, studentId, status));
  }

  @PostMapping("/appeals")
  public ApiResponse<AppealSummary> createAppeal(@Valid @RequestBody CreateAppealRequest request) {
    return ApiResponse.ok(gradingService.createAppeal(request));
  }

  @PostMapping("/appeals/{appealId}/resolve")
  public ApiResponse<AppealSummary> resolveAppeal(
      @PathVariable("appealId") Long appealId,
      @Valid @RequestBody ResolveAppealRequest request
  ) {
    return ApiResponse.ok(gradingService.resolveAppeal(appealId, request));
  }
}
