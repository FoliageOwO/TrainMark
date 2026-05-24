package com.trainmark.file;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.AuthenticatedUser;
import com.trainmark.shared.dto.SubmissionSummary;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {
  private final UploadService uploadService;

  public SubmissionController(UploadService uploadService) {
    this.uploadService = uploadService;
  }

  @GetMapping
  public ApiResponse<Collection<SubmissionSummary>> list(
      @RequestParam(name = "assignmentId", required = false) Long assignmentId,
      @RequestParam(name = "studentId", required = false) Long studentId,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    var currentUser = currentUser(userId, username, roles);
    var effectiveStudentId = currentUser.isStudent() ? currentUser.userId() : studentId;
    if (studentId != null) {
      currentUser.requireStudentOwner(studentId);
    }
    return ApiResponse.ok(uploadService.listSubmissions(assignmentId, effectiveStudentId));
  }

  @GetMapping("/{submissionId}/file")
  public ResponseEntity<byte[]> downloadFile(
      @PathVariable("submissionId") Long submissionId,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    var descriptor = uploadService.getSubmissionFileDescriptor(submissionId);
    currentUser(userId, username, roles).requireStudentOwner(descriptor.studentId());
    var file = uploadService.downloadSubmissionFile(submissionId);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_TYPE, file.contentType())
        .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
            .filename(file.fileName(), StandardCharsets.UTF_8)
            .build()
            .toString())
        .body(file.content());
  }

  @DeleteMapping("/{submissionId}")
  public ApiResponse<Void> delete(
      @PathVariable("submissionId") Long submissionId,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    var descriptor = uploadService.getSubmissionFileDescriptor(submissionId);
    currentUser(userId, username, roles).requireStudentOwner(descriptor.studentId());
    uploadService.deleteSubmission(submissionId);
    return ApiResponse.ok(null);
  }

  private AuthenticatedUser currentUser(String userId, String username, String roles) {
    return AuthenticatedUser.fromHeaders(userId, username, roles);
  }
}
