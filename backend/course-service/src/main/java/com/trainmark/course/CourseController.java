package com.trainmark.course;

import com.trainmark.shared.ApiResponse;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/courses")
public class CourseController {
  @GetMapping
  public ApiResponse<List<Map<String, Object>>> list() {
    return ApiResponse.ok(List.of(Map.of("id", 1, "name", "Java Web 综合实训", "classes", 2)));
  }
}
