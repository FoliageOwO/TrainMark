package com.trainmark.file;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.SubmissionSummary;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
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
}
