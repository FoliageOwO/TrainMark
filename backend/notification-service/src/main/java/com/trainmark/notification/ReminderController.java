package com.trainmark.notification;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.CreateNotificationRequest;
import com.trainmark.shared.dto.NotificationSummary;
import com.trainmark.shared.dto.ReminderRequest;
import com.trainmark.shared.dto.ReminderResult;
import com.trainmark.shared.dto.SubmissionCollectionOverview;
import com.trainmark.shared.dto.UnsubmittedStudent;
import jakarta.validation.Valid;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

  @GetMapping
  public ApiResponse<Collection<NotificationSummary>> list(
      @RequestParam("userId") Long userId,
      @RequestParam(name = "unreadOnly", defaultValue = "false") boolean unreadOnly
  ) {
    return ApiResponse.ok(reminderService.listNotifications(userId, unreadOnly));
  }

  @PostMapping
  public ApiResponse<NotificationSummary> create(@Valid @RequestBody CreateNotificationRequest request) {
    return ApiResponse.ok(reminderService.createNotification(request));
  }

  @PatchMapping("/{id}/read")
  public ApiResponse<Void> markAsRead(@PathVariable("id") Long id, @RequestParam("userId") Long userId) {
    reminderService.markAsRead(id, userId);
    return ApiResponse.ok(null);
  }

  @PatchMapping("/read-all")
  public ApiResponse<Void> markAllAsRead(@RequestParam("userId") Long userId) {
    reminderService.markAllAsRead(userId);
    return ApiResponse.ok(null);
  }
}
