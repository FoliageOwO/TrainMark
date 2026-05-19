package com.trainmark.grading;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.grading.export-async-enabled", havingValue = "true")
public class GradeExportPublisher {
  private static final Logger log = LoggerFactory.getLogger(GradeExportPublisher.class);

  private final RabbitTemplate rabbitTemplate;
  private final GradeExportQueueConfig queueConfig;

  public GradeExportPublisher(RabbitTemplate rabbitTemplate, GradeExportQueueConfig queueConfig) {
    this.rabbitTemplate = rabbitTemplate;
    this.queueConfig = queueConfig;
  }

  public void publish(GradeExportMessage message) {
    rabbitTemplate.convertAndSend(queueConfig.exchangeName(), queueConfig.routingKey(), message);
    log.info("Published grade export {} for assignment {}", message.exportId(), message.assignmentId());
  }
}
