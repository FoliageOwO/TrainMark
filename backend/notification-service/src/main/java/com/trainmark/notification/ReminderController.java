package com.trainmark.notification;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.ReminderRequest;
import com.trainmark.shared.dto.ReminderResult;
import com.trainmark.shared.dto.SubmissionCollectionOverview;
import com.trainmark.shared.dto.UnsubmittedStudent;
import jakarta.validation.Valid;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class ReminderController {
  private final ReminderService reminderService;

  public ReminderController(ReminderService reminderService) {
    this.reminderService = reminderService;
  }

  @GetMapping("/assignments/{assignmentId}/collection")
  public ApiResponse<SubmissionCollectionOverview> collection(@PathVariable("assignmentId") Long assignmentId) {
    return ApiResponse.ok(reminderService.collectionOverview(assignmentId));
  }

  @GetMapping("/assignments/{assignmentId}/unsubmitted")
  public ApiResponse<Collection<UnsubmittedStudent>> unsubmitted(@PathVariable("assignmentId") Long assignmentId) {
    return ApiResponse.ok(reminderService.unsubmittedStudents(assignmentId));
  }

  @PostMapping("/remind-unsubmitted")
  public ApiResponse<ReminderResult> remind(@Valid @RequestBody ReminderRequest request) {
    return ApiResponse.ok(reminderService.remind(request));
  }
}
