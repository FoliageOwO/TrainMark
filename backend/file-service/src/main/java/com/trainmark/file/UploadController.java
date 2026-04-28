package com.trainmark.file;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.CompleteUploadRequest;
import com.trainmark.shared.dto.InitializeUploadRequest;
import com.trainmark.shared.dto.InitializeUploadResponse;
import com.trainmark.shared.dto.SubmissionReceipt;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/submissions/upload")
public class UploadController {
  private final UploadService uploadService;

  public UploadController(UploadService uploadService) {
    this.uploadService = uploadService;
  }

  @PostMapping("/init")
  public ApiResponse<InitializeUploadResponse> initialize(@Valid @RequestBody InitializeUploadRequest request) {
    return ApiResponse.ok(uploadService.initialize(request));
  }

  @PostMapping("/complete")
  public ApiResponse<SubmissionReceipt> complete(@Valid @RequestBody CompleteUploadRequest request) {
    return ApiResponse.ok(uploadService.complete(request));
  }
}
