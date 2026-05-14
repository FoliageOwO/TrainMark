package com.trainmark.file;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.SubmissionSummary;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
      @RequestParam(required = false) Long assignmentId,
      @RequestParam(required = false) Long studentId
  ) {
    return ApiResponse.ok(uploadService.listSubmissions(assignmentId, studentId));
  }

  @GetMapping("/{submissionId}/file")
  public ResponseEntity<byte[]> downloadFile(@PathVariable Long submissionId) {
    var file = uploadService.downloadSubmissionFile(submissionId);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_TYPE, file.contentType())
        .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
            .filename(file.fileName(), StandardCharsets.UTF_8)
            .build()
            .toString())
        .body(file.content());
  }
}
