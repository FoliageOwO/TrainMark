package com.trainmark.grading;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.CreateGradeExportRequest;
import com.trainmark.shared.dto.GradeExportSummary;
import jakarta.validation.Valid;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
      @RequestParam(name = "assignmentId", required = false) Long assignmentId
  ) {
    return ApiResponse.ok(gradingService.listGradeExports(assignmentId));
  }

  @PostMapping
  public ApiResponse<GradeExportSummary> create(@Valid @RequestBody CreateGradeExportRequest request) {
    return ApiResponse.ok(gradingService.createGradeExport(request));
  }
}
