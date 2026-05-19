package com.trainmark.ocr;

import com.trainmark.shared.dto.CreateOcrJobRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.ocr.async-enabled", havingValue = "true")
public class OcrJobConsumer {
  private static final Logger log = LoggerFactory.getLogger(OcrJobConsumer.class);

  private final OcrStore store;

  public OcrJobConsumer(OcrStore store) {
    this.store = store;
  }

  @RabbitListener(queues = "${trainmark.ocr.queue.name:trainmark-ocr-jobs}")
  public void handleOcrJob(OcrJobMessage message) {
    log.info("Consuming OCR job {} for submission {}", message.jobId(), message.submissionId());
    try {
      store.completeJob(
          message.jobId(),
          new CreateOcrJobRequest(message.submissionId(), message.objectKey(), message.mode())
      );
      log.info("Completed OCR job {}", message.jobId());
    } catch (Exception error) {
      log.error("Failed to process OCR job {}", message.jobId(), error);
      store.failJob(message.jobId());
    }
  }
}
