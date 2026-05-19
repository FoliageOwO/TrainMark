package com.trainmark.ocr;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.ocr.async-enabled", havingValue = "true")
public class OcrJobPublisher {
  private static final Logger log = LoggerFactory.getLogger(OcrJobPublisher.class);

  private final RabbitTemplate rabbitTemplate;
  private final OcrQueueConfig queueConfig;

  public OcrJobPublisher(RabbitTemplate rabbitTemplate, OcrQueueConfig queueConfig) {
    this.rabbitTemplate = rabbitTemplate;
    this.queueConfig = queueConfig;
  }

  public void publish(OcrJobMessage message) {
    rabbitTemplate.convertAndSend(queueConfig.exchangeName(), queueConfig.routingKey(), message);
    log.info("Published OCR job {} for submission {}", message.jobId(), message.submissionId());
  }
}
