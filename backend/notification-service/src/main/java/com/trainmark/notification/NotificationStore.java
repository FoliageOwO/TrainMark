package com.trainmark.notification;

import com.trainmark.shared.dto.CreateNotificationRequest;
import com.trainmark.shared.dto.NotificationSummary;
import com.trainmark.shared.dto.ReminderRequest;
import com.trainmark.shared.dto.ReminderResult;
import com.trainmark.shared.dto.SubmissionCollectionOverview;
import com.trainmark.shared.dto.UnsubmittedStudent;
import java.util.Collection;

public interface NotificationStore {
  SubmissionCollectionOverview collectionOverview(Long assignmentId);

  Collection<UnsubmittedStudent> unsubmittedStudents(Long assignmentId);

  ReminderResult remind(ReminderRequest request);

  ReminderResult createPendingReminder(ReminderRequest request);

  ReminderResult completeReminder(ReminderRequest request, java.time.OffsetDateTime scheduledAt);

  void failReminder(ReminderRequest request, java.time.OffsetDateTime scheduledAt);

  NotificationSummary createNotification(CreateNotificationRequest request);

  Collection<NotificationSummary> listNotifications(Long userId, boolean unreadOnly);

  int markAsRead(Long notificationId, Long userId);

  int markAllAsRead(Long userId);
}
