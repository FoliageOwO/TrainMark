package com.trainmark.notification;

import com.trainmark.shared.dto.ReminderRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.notification.async-enabled", havingValue = "true")
public class NotificationJobConsumer {
  private static final Logger log = LoggerFactory.getLogger(NotificationJobConsumer.class);

  private final ReminderService reminderService;

  public NotificationJobConsumer(ReminderService reminderService) {
    this.reminderService = reminderService;
  }

  @RabbitListener(queues = "${trainmark.notification.queue.name:trainmark-notification-jobs}")
  public void handleReminder(NotificationJobMessage message) {
    var request = new ReminderRequest(message.assignmentId(), message.studentIds(), message.channels(), message.message());
    log.info("Consuming reminder job for assignment {} to {} recipients", message.assignmentId(), message.studentIds().size());
    reminderService.completePendingReminder(request, message.scheduledAt());
  }
}
