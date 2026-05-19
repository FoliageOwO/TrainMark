package com.trainmark.grading;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.grading.export-async-enabled", havingValue = "true")
public class GradeExportConsumer {
  private static final Logger log = LoggerFactory.getLogger(GradeExportConsumer.class);

  private final GradingService gradingService;
  private final GradeExportStore gradeExportStore;

  public GradeExportConsumer(GradingService gradingService, GradeExportStore gradeExportStore) {
    this.gradingService = gradingService;
    this.gradeExportStore = gradeExportStore;
  }

  @RabbitListener(queues = "${trainmark.grading.export-queue.name:trainmark-grade-export-jobs}")
  public void handleGradeExport(GradeExportMessage message) {
    log.info("Consuming grade export {} for assignment {}", message.exportId(), message.assignmentId());
    try {
      var rowCount = gradingService.publishedResultCount(message.assignmentId());
      gradeExportStore.markGradeExportReady(message.exportId(), rowCount);
      log.info("Completed grade export {} with {} rows", message.exportId(), rowCount);
    } catch (Exception error) {
      log.error("Failed to process grade export {}", message.exportId(), error);
      gradeExportStore.markGradeExportFailed(message.exportId());
    }
  }
}
