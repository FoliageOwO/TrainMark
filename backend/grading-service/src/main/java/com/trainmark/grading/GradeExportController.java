package com.trainmark.grading;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.AuthenticatedUser;
import com.trainmark.shared.dto.CreateGradeExportRequest;
import com.trainmark.shared.dto.GradeExportSummary;
import jakarta.validation.Valid;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/grading/exports")
public class GradeExportController {
  private final GradingService gradingService;

  public GradeExportController(GradingService gradingService) {
    this.gradingService = gradingService;
  }

  @GetMapping
  public ApiResponse<Collection<GradeExportSummary>> list(
      @RequestParam(name = "assignmentId", required = false) Long assignmentId,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    currentUser(userId, username, roles).requireStaff();
    return ApiResponse.ok(gradingService.listGradeExports(assignmentId));
  }

  @PostMapping
  public ApiResponse<GradeExportSummary> create(
      @Valid @RequestBody CreateGradeExportRequest request,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    currentUser(userId, username, roles).requireStaff();
    return ApiResponse.ok(gradingService.createGradeExport(request));
  }

  private AuthenticatedUser currentUser(String userId, String username, String roles) {
    return AuthenticatedUser.fromHeaders(userId, username, roles);
  }
}
