package com.trainmark.course;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.CourseSummary;
import com.trainmark.shared.dto.CreateCourseRequest;
import com.trainmark.shared.dto.CreateTeachingClassRequest;
import com.trainmark.shared.dto.TeachingClassSummary;
import jakarta.validation.Valid;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/courses")
public class CourseController {
  private final CourseService courseService;

  public CourseController(CourseService courseService) {
    this.courseService = courseService;
  }

  @GetMapping
  public ApiResponse<Collection<CourseSummary>> list() {
    return ApiResponse.ok(courseService.listCourses());
  }

  @PostMapping
  public ApiResponse<CourseSummary> create(@Valid @RequestBody CreateCourseRequest request) {
    return ApiResponse.ok(courseService.createCourse(request));
  }

  @GetMapping("/{courseId}/classes")
  public ApiResponse<Collection<TeachingClassSummary>> listClasses(@PathVariable Long courseId) {
    return ApiResponse.ok(courseService.listClasses(courseId));
  }

  @PostMapping("/{courseId}/classes")
  public ApiResponse<TeachingClassSummary> createClass(
      @PathVariable Long courseId,
      @Valid @RequestBody CreateTeachingClassRequest request
  ) {
    return ApiResponse.ok(courseService.createClass(courseId, request));
  }
}
