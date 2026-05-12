package com.trainmark.grading;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.CreateRubricRequest;
import com.trainmark.shared.dto.RubricSummary;
import jakarta.validation.Valid;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rubrics")
public class RubricController {
  private final GradingService gradingService;

  public RubricController(GradingService gradingService) {
    this.gradingService = gradingService;
  }

  @GetMapping
  public ApiResponse<Collection<RubricSummary>> list(@RequestParam(required = false) Long assignmentId) {
    return ApiResponse.ok(gradingService.listRubrics(assignmentId));
  }

  @PostMapping
  public ApiResponse<RubricSummary> create(@Valid @RequestBody CreateRubricRequest request) {
    return ApiResponse.ok(gradingService.createRubric(request));
  }
}
