package com.trainmark.course;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.AssignmentSummary;
import com.trainmark.shared.dto.CreateAssignmentRequest;
import jakarta.validation.Valid;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {
  private final CourseService courseService;

  public AssignmentController(CourseService courseService) {
    this.courseService = courseService;
  }

  @GetMapping
  public ApiResponse<Collection<AssignmentSummary>> list(@RequestParam(required = false) Long courseId) {
    return ApiResponse.ok(courseService.listAssignments(courseId));
  }

  @PostMapping
  public ApiResponse<AssignmentSummary> create(@Valid @RequestBody CreateAssignmentRequest request) {
    return ApiResponse.ok(courseService.createAssignment(request));
  }
}
