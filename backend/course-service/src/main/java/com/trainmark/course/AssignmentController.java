package com.trainmark.course;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.NotificationClient;
import com.trainmark.shared.dto.AssignmentSummary;
import com.trainmark.shared.dto.CreateAssignmentRequest;
import jakarta.validation.Valid;
import java.util.Collection;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {
  private final CourseService courseService;
  private final NotificationClient notificationClient;

  public AssignmentController(
      CourseService courseService,
      @Value("${trainmark.notification.base-url:http://localhost:8089}") String notificationBaseUrl,
      @Value("${trainmark.notification.event-enabled:true}") boolean notificationEnabled
  ) {
    this.courseService = courseService;
    this.notificationClient = new NotificationClient(notificationBaseUrl, notificationEnabled);
  }

  @GetMapping
  public ApiResponse<Collection<AssignmentSummary>> list(
      @RequestParam(name = "courseId", required = false) Long courseId
  ) {
    return ApiResponse.ok(courseService.listAssignments(courseId));
  }

  @PostMapping
  public ApiResponse<AssignmentSummary> create(@Valid @RequestBody CreateAssignmentRequest request) {
    return ApiResponse.ok(courseService.createAssignment(request));
  }

  @PostMapping("/{assignmentId}/publish")
  public ApiResponse<AssignmentSummary> publish(@PathVariable("assignmentId") Long assignmentId) {
    var assignment = courseService.publishAssignment(assignmentId);
    notificationClient.sendNotifications(
        assignment.id(),
        courseService.assignmentStudentIds(assignment.id()),
        "任务发布",
        assignment.title() + " 已发布，请及时查看并提交报告。",
        "ASSIGNMENT_PUBLISHED",
        "/tasks/" + assignment.id()
    );
    return ApiResponse.ok(assignment);
  }
}
