package com.trainmark.notification;

import com.trainmark.shared.dto.CreateNotificationRequest;
import com.trainmark.shared.dto.NotificationSummary;
import com.trainmark.shared.dto.ReminderRequest;
import com.trainmark.shared.dto.ReminderResult;
import com.trainmark.shared.dto.SubmissionCollectionOverview;
import com.trainmark.shared.dto.UnsubmittedStudent;
import java.util.Collection;
import org.springframework.beans.factory.ObjectProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class ReminderService {
  private static final Logger log = LoggerFactory.getLogger(ReminderService.class);

  private final NotificationStore store;
  private final JavaMailSender mailSender;
  private final NotificationJobPublisher jobPublisher;
  private final boolean emailEnabled;
  private final boolean asyncEnabled;
  private final String fromEmail;

  public ReminderService(
      NotificationStore store,
      JavaMailSender mailSender,
      ObjectProvider<NotificationJobPublisher> jobPublisher,
      @Value("${trainmark.notification.email-enabled:false}") boolean emailEnabled,
      @Value("${trainmark.notification.async-enabled:false}") boolean asyncEnabled,
      @Value("${trainmark.notification.from-email:}") String fromEmail
  ) {
    this.store = store;
    this.mailSender = mailSender;
    this.jobPublisher = jobPublisher.getIfAvailable();
    this.emailEnabled = emailEnabled;
    this.asyncEnabled = asyncEnabled;
    this.fromEmail = fromEmail;
  }

  public SubmissionCollectionOverview collectionOverview(Long assignmentId) {
    return store.collectionOverview(assignmentId);
  }

  public Collection<UnsubmittedStudent> unsubmittedStudents(Long assignmentId) {
    return store.unsubmittedStudents(assignmentId);
  }

  public ReminderResult remind(ReminderRequest request) {
    if (asyncEnabled) {
      var result = store.createPendingReminder(request);
      if (jobPublisher == null) {
        store.failReminder(request, result.scheduledAt());
        throw new IllegalStateException("Notification async publisher is not available");
      }
      try {
        jobPublisher.publish(new NotificationJobMessage(
            request.assignmentId(),
            request.studentIds(),
            request.channels(),
            request.message(),
            result.scheduledAt()
        ));
      } catch (RuntimeException error) {
        store.failReminder(request, result.scheduledAt());
        throw error;
      }
      return result;
    }
    var result = store.remind(request);

    if (emailEnabled && request.channels().contains("EMAIL")) {
      for (var student : request.studentIds()) {
        sendReminderEmail(student, request);
      }
    }

    return result;
  }

  public ReminderResult completePendingReminder(ReminderRequest request, java.time.OffsetDateTime scheduledAt) {
    if (emailEnabled && request.channels().contains("EMAIL")) {
      for (var student : request.studentIds()) {
        sendReminderEmail(student, request);
      }
    }
    try {
      return store.completeReminder(request, scheduledAt);
    } catch (RuntimeException error) {
      store.failReminder(request, scheduledAt);
      throw error;
    }
  }

  public Collection<NotificationSummary> listNotifications(Long userId, boolean unreadOnly) {
    return store.listNotifications(userId, unreadOnly);
  }

  public NotificationSummary createNotification(CreateNotificationRequest request) {
    return store.createNotification(request);
  }

  public int markAsRead(Long notificationId, Long userId) {
    return store.markAsRead(notificationId, userId);
  }

  public int markAllAsRead(Long userId) {
    return store.markAllAsRead(userId);
  }

  private void sendReminderEmail(Long studentId, ReminderRequest request) {
    if (fromEmail == null || fromEmail.isBlank()) {
      log.warn("Email notifications enabled but from-email is not configured");
      return;
    }

    try {
      var message = mailSender.createMimeMessage();
      var helper = new MimeMessageHelper(message, "UTF-8");
      helper.setFrom(fromEmail);
      helper.setTo("student" + studentId + "@trainmark.local");
      helper.setSubject("TrainMark AI - 实训报告提交提醒");
      helper.setText(request.message(), false);
      mailSender.send(message);
      log.info("Sent reminder email to student {}", studentId);
    } catch (Exception e) {
      log.error("Failed to send reminder email to student {}", studentId, e);
    }
  }
}
