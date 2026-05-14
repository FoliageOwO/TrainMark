package com.trainmark.file;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.CompleteUploadRequest;
import com.trainmark.shared.dto.InitializeUploadRequest;
import com.trainmark.shared.dto.InitializeUploadResponse;
import com.trainmark.shared.dto.SubmissionReceipt;
import com.trainmark.shared.dto.UploadObjectSummary;
import jakarta.validation.Valid;
import java.io.IOException;
import org.springframework.http.MediaType;
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

  @PutMapping(value = "/content", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiResponse<UploadObjectSummary> uploadContent(
      @RequestParam String uploadId,
      @RequestParam String objectKey,
      @RequestParam MultipartFile file
  ) throws IOException {
    return ApiResponse.ok(uploadService.storeContent(
        uploadId,
        objectKey,
        file.getContentType(),
        file.getSize(),
        file.getInputStream()
    ));
  }
}
