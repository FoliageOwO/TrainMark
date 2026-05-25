package com.trainmark.file;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.AuthenticatedUser;
import com.trainmark.shared.NotificationClient;
import com.trainmark.shared.dto.CompleteUploadRequest;
import com.trainmark.shared.dto.InitializeUploadRequest;
import com.trainmark.shared.dto.InitializeUploadResponse;
import com.trainmark.shared.dto.SubmissionReceipt;
import com.trainmark.shared.dto.UploadObjectSummary;
import jakarta.validation.Valid;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/submissions/upload")
public class UploadController {
  private final UploadService uploadService;
  private final NotificationClient notificationClient;

  public UploadController(
      UploadService uploadService,
      @Value("${trainmark.notification.base-url:http://localhost:8089}") String notificationBaseUrl,
      @Value("${trainmark.notification.event-enabled:true}") boolean notificationEnabled
  ) {
    this.uploadService = uploadService;
    this.notificationClient = new NotificationClient(notificationBaseUrl, notificationEnabled);
  }

  @PostMapping("/init")
  public ApiResponse<InitializeUploadResponse> initialize(
      @Valid @RequestBody InitializeUploadRequest request,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    currentUser(userId, username, roles).requireStudentOwner(request.studentId());
    return ApiResponse.ok(uploadService.initialize(request));
  }

  @PostMapping("/complete")
  public ApiResponse<SubmissionReceipt> complete(
      @Valid @RequestBody CompleteUploadRequest request,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) {
    currentUser(userId, username, roles).requireStudentOwner(uploadService.findUploadStudentId(request.uploadId()));
    var receipt = uploadService.complete(request);
    var displayName = username == null || username.isBlank() ? "学生 " + receipt.studentId() : username;
    var replaced = receipt.version() > 1;
    notificationClient.sendNotifications(
        receipt.assignmentId(),
        uploadService.assignmentTeacherIds(receipt.assignmentId()),
        replaced ? "学生覆盖提交报告" : "学生已提交报告",
        replaced
            ? displayName + " 已覆盖上一份报告，教师端将以最新文件为准：" + receipt.fileName()
            : displayName + " 已提交报告：" + receipt.fileName(),
        "SUBMISSION_UPLOADED",
        "/collection/" + receipt.assignmentId()
    );
    return ApiResponse.ok(receipt);
  }

  @PutMapping(value = "/content", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiResponse<UploadObjectSummary> uploadContent(
      @RequestParam(name = "uploadId") String uploadId,
      @RequestParam(name = "objectKey") String objectKey,
      @RequestParam(name = "file") MultipartFile file,
      @RequestHeader(name = AuthenticatedUser.USER_ID_HEADER, required = false) String userId,
      @RequestHeader(name = AuthenticatedUser.USERNAME_HEADER, required = false) String username,
      @RequestHeader(name = AuthenticatedUser.ROLES_HEADER, required = false) String roles
  ) throws IOException {
    currentUser(userId, username, roles).requireStudentOwner(uploadService.findUploadStudentId(uploadId));
    return ApiResponse.ok(uploadService.storeContent(
        uploadId,
        objectKey,
        file.getContentType(),
        file.getSize(),
        file.getInputStream()
    ));
  }

  private AuthenticatedUser currentUser(String userId, String username, String roles) {
    return AuthenticatedUser.fromHeaders(userId, username, roles);
  }
}
