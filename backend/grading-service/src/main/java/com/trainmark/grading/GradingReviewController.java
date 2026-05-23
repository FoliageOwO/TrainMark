package com.trainmark.grading;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.AppealStatus;
import com.trainmark.shared.AuthenticatedUser;
import com.trainmark.shared.PublicationStatus;
import com.trainmark.shared.ReviewStatus;
import com.trainmark.shared.TrainMarkAccessDeniedException;
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
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
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
      @RequestParam(name = "reviewStatus", required = false) ReviewStatus reviewStatus,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    var currentUser = currentUser(userId, username, roles);
    var results = gradingService.listResults(assignmentId, reviewStatus);
    if (currentUser.isStudent()) {
      return ApiResponse.ok(studentVisibleResults(results, currentUser.userId()));
    }
    return ApiResponse.ok(results);
  }

  @GetMapping("/{resultId}")
  public ApiResponse<GradingResultSummary> get(
      @PathVariable("resultId") Long resultId,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    var result = gradingService.getResult(resultId);
    requireResultVisibleToStudent(currentUser(userId, username, roles), result);
    return ApiResponse.ok(result);
  }

  @PatchMapping("/{resultId}/items")
  public ApiResponse<GradingResultSummary> updateItem(
      @PathVariable("resultId") Long resultId,
      @Valid @RequestBody UpdateReviewItemRequest request,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    currentUser(userId, username, roles).requireStaff();
    return ApiResponse.ok(gradingService.updateReviewItem(resultId, request));
  }

  @PostMapping("/{resultId}/approve")
  public ApiResponse<GradingResultSummary> approve(
      @PathVariable("resultId") Long resultId,
      @Valid @RequestBody ReviewDecisionRequest request,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    currentUser(userId, username, roles).requireStaff();
    return ApiResponse.ok(gradingService.approveResult(resultId, request));
  }

  @GetMapping("/publications")
  public ApiResponse<Collection<GradePublicationSummary>> listPublications(
      @RequestParam(name = "assignmentId", required = false) Long assignmentId,
      @RequestParam(name = "publicationStatus", required = false) PublicationStatus publicationStatus,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    var currentUser = currentUser(userId, username, roles);
    var publications = gradingService.listPublications(assignmentId, publicationStatus);
    if (currentUser.isStudent()) {
      return ApiResponse.ok(publications.stream()
          .filter(item -> currentUser.userId().equals(item.studentId()))
          .filter(item -> item.publicationStatus() == PublicationStatus.PUBLISHED)
          .toList());
    }
    return ApiResponse.ok(publications);
  }

  @PostMapping("/{resultId}/publish")
  public ApiResponse<GradingResultSummary> publish(
      @PathVariable("resultId") Long resultId,
      @Valid @RequestBody PublishGradeRequest request,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    currentUser(userId, username, roles).requireStaff();
    return ApiResponse.ok(gradingService.publishResult(resultId, request));
  }

  @PostMapping("/{resultId}/withdraw")
  public ApiResponse<GradingResultSummary> withdraw(
      @PathVariable("resultId") Long resultId,
      @Valid @RequestBody WithdrawGradeRequest request,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    currentUser(userId, username, roles).requireStaff();
    return ApiResponse.ok(gradingService.withdrawResult(resultId, request));
  }

  @GetMapping("/{resultId}/publication-audits")
  public ApiResponse<Collection<GradePublicationAuditEntry>> listPublicationAudits(
      @PathVariable("resultId") Long resultId,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    currentUser(userId, username, roles).requireStaff();
    return ApiResponse.ok(gradingService.listPublicationAudits(resultId));
  }

  @GetMapping("/appeals")
  public ApiResponse<Collection<AppealSummary>> listAppeals(
      @RequestParam(name = "resultId", required = false) Long resultId,
      @RequestParam(name = "studentId", required = false) Long studentId,
      @RequestParam(name = "status", required = false) AppealStatus status,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    var currentUser = currentUser(userId, username, roles);
    var effectiveStudentId = currentUser.isStudent() ? currentUser.userId() : studentId;
    if (studentId != null) {
      currentUser.requireStudentOwner(studentId);
    }
    return ApiResponse.ok(gradingService.listAppeals(resultId, effectiveStudentId, status));
  }

  @PostMapping("/appeals")
  public ApiResponse<AppealSummary> createAppeal(
      @Valid @RequestBody CreateAppealRequest request,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    var currentUser = currentUser(userId, username, roles);
    currentUser.requireStudentOwner(request.studentId());
    requireResultVisibleToStudent(currentUser, gradingService.getResult(request.resultId()));
    return ApiResponse.ok(gradingService.createAppeal(request));
  }

  @PostMapping("/appeals/{appealId}/resolve")
  public ApiResponse<AppealSummary> resolveAppeal(
      @PathVariable("appealId") Long appealId,
      @Valid @RequestBody ResolveAppealRequest request,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    currentUser(userId, username, roles).requireStaff();
    return ApiResponse.ok(gradingService.resolveAppeal(appealId, request));
  }

  private AuthenticatedUser currentUser(String userId, String username, String roles) {
    return AuthenticatedUser.fromHeaders(userId, username, roles);
  }

  private List<GradingResultSummary> studentVisibleResults(
      Collection<GradingResultSummary> results,
      Long studentId
  ) {
    return results.stream()
        .filter(item -> studentId.equals(item.studentId()))
        .filter(item -> item.publicationStatus() == PublicationStatus.PUBLISHED)
        .toList();
  }

  private void requireResultVisibleToStudent(AuthenticatedUser currentUser, GradingResultSummary result) {
    if (!currentUser.isStudent()) {
      return;
    }
    currentUser.requireStudentOwner(result.studentId());
    if (result.publicationStatus() != PublicationStatus.PUBLISHED) {
      throw new TrainMarkAccessDeniedException("Students can only access published results");
    }
  }
}
