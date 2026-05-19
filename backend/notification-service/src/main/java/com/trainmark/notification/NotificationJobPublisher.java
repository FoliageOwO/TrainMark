package com.trainmark.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.notification.async-enabled", havingValue = "true")
public class NotificationJobPublisher {
  private static final Logger log = LoggerFactory.getLogger(NotificationJobPublisher.class);

  private final RabbitTemplate rabbitTemplate;
  private final NotificationQueueConfig queueConfig;

  public NotificationJobPublisher(RabbitTemplate rabbitTemplate, NotificationQueueConfig queueConfig) {
    this.rabbitTemplate = rabbitTemplate;
    this.queueConfig = queueConfig;
  }

  public void publish(NotificationJobMessage message) {
    rabbitTemplate.convertAndSend(queueConfig.exchangeName(), queueConfig.routingKey(), message);
    log.info("Published reminder job for assignment {} to {} recipients", message.assignmentId(), message.studentIds().size());
  }
}
