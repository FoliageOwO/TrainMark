package com.trainmark.notification;

import com.trainmark.shared.NotificationChannel;
import com.trainmark.shared.NotificationStatus;
import com.trainmark.shared.dto.CreateNotificationRequest;
import com.trainmark.shared.dto.NotificationSummary;
import com.trainmark.shared.dto.ReminderRequest;
import com.trainmark.shared.dto.ReminderResult;
import com.trainmark.shared.dto.SubmissionCollectionOverview;
import com.trainmark.shared.dto.UnsubmittedStudent;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.notification.store", havingValue = "memory", matchIfMissing = true)
public class InMemoryNotificationStore implements NotificationStore {
  private final AtomicLong notificationIds = new AtomicLong(1);
  private final ConcurrentHashMap<Long, NotificationSummary> notifications = new ConcurrentHashMap<>();

  private final List<UnsubmittedStudent> unsubmittedStudents = List.of(
      new UnsubmittedStudent(12L, "2024010112", "周明", "软件2401班", "zhouming@trainmark.local"),
      new UnsubmittedStudent(18L, "2024010118", "钱雨", "软件2401班", "qianyu@trainmark.local"),
      new UnsubmittedStudent(43L, "2024010243", "孙可", "软件2402班", "sunke@trainmark.local")
  );

  public InMemoryNotificationStore() {
    // Seed demo notifications
    addNotification("任务发布", "Java Web 综合实训报告已发布，请及时查看要求。", "ASSIGNMENT_PUBLISHED", false, "/tasks/1");
    addNotification("催交提醒", "您有 31 名学生未提交实训报告，请及时催交。", "REMINDER", false, "/collection/1");
    addNotification("批改完成", "AI 已完成 65 份报告的批改，请前往复核。", "GRADING_COMPLETE", false, "/review/1");
    addNotification("成绩发布", "您的实训报告成绩已发布，请查看详情。", "GRADE_PUBLISHED", false, "/results/1");
    addNotification("申诉处理", "您有一条申诉需要处理。", "APPEAL", false, "/appeals/1");
  }

  private void addNotification(String title, String message, String type, boolean isRead, String targetUrl) {
    var id = notificationIds.getAndIncrement();
    notifications.put(id, new NotificationSummary(
        id, title, message, type, isRead, targetUrl,
        OffsetDateTime.now().minusMinutes(id * 15)
    ));
  }

  private NotificationSummary addNotification(CreateNotificationRequest request) {
    var id = notificationIds.getAndIncrement();
    var notification = new NotificationSummary(
        id,
        request.title(),
        request.message(),
        request.type(),
        false,
        request.targetUrl(),
        OffsetDateTime.now()
    );
    notifications.put(id, notification);
    return notification;
  }

  @Override
  public SubmissionCollectionOverview collectionOverview(Long assignmentId) {
    return new SubmissionCollectionOverview(assignmentId, 96, 65, 31, 4, 18, 12, 0);
  }

  @Override
  public Collection<UnsubmittedStudent> unsubmittedStudents(Long assignmentId) {
    return unsubmittedStudents;
  }

  @Override
  public ReminderResult remind(ReminderRequest request) {
    var pending = createPendingReminder(request);
    return completeReminder(request, pending.scheduledAt());
  }

  @Override
  public ReminderResult createPendingReminder(ReminderRequest request) {
    var channels = request.channels().isEmpty() ? List.of(NotificationChannel.IN_APP) : request.channels();
    for (var studentId : request.studentIds()) {
      addNotification("提交催交", request.message(), "REMINDER_SENT", false, "/tasks/" + request.assignmentId());
    }
    return new ReminderResult(
        request.assignmentId(),
        request.studentIds().size(),
        request.studentIds().size() * channels.size(),
        channels,
        NotificationStatus.PENDING,
        OffsetDateTime.now()
    );
  }

  @Override
  public ReminderResult completeReminder(ReminderRequest request, OffsetDateTime scheduledAt) {
    var channels = request.channels().isEmpty() ? List.of(NotificationChannel.IN_APP) : request.channels();
    return new ReminderResult(
        request.assignmentId(),
        request.studentIds().size(),
        request.studentIds().size() * channels.size(),
        channels,
        NotificationStatus.SENT,
        scheduledAt
    );
  }

  @Override
  public void failReminder(ReminderRequest request, OffsetDateTime scheduledAt) {
    // In-memory reminder rows are represented only as user-facing notifications.
  }

  @Override
  public NotificationSummary createNotification(CreateNotificationRequest request) {
    return addNotification(request);
  }

  @Override
  public Collection<NotificationSummary> listNotifications(Long userId, boolean unreadOnly) {
    return notifications.values().stream()
        .filter(n -> !unreadOnly || !n.isRead())
        .sorted((a, b) -> b.createdAt().compareTo(a.createdAt()))
        .toList();
  }

  @Override
  public int markAsRead(Long notificationId, Long userId) {
    var notification = notifications.get(notificationId);
    if (notification != null) {
      notifications.put(notificationId, new NotificationSummary(
          notification.id(),
          notification.title(),
          notification.message(),
          notification.type(),
          true,
          notification.targetUrl(),
          notification.createdAt()
      ));
      return 1;
    }
    return 0;
  }

  @Override
  public int markAllAsRead(Long userId) {
    var count = 0;
    for (var entry : notifications.entrySet()) {
      var n = entry.getValue();
      if (!n.isRead()) {
        notifications.put(entry.getKey(), new NotificationSummary(
            n.id(), n.title(), n.message(), n.type(), true, n.targetUrl(), n.createdAt()
        ));
        count++;
      }
    }
    return count;
  }
}
