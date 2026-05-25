package com.trainmark.grading;

import com.trainmark.shared.GradingJobStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Consumes grading jobs from RabbitMQ and processes them asynchronously.
 */
@Component
@ConditionalOnProperty(name = "trainmark.grading.async-enabled", havingValue = "true")
public class GradingJobConsumer {
    private static final Logger log = LoggerFactory.getLogger(GradingJobConsumer.class);

    private final GradingService gradingService;
    private final GradingJobStore jobStore;

    public GradingJobConsumer(GradingService gradingService, GradingJobStore jobStore) {
        this.gradingService = gradingService;
        this.jobStore = jobStore;
    }

    @RabbitListener(queues = "${trainmark.grading.queue.name:trainmark-grading-jobs}")
    public void handleGradingJob(GradingJobMessage message) {
        log.info("Consuming grading job {} for {} submissions",
                message.jobId(), message.submissionIds().size());

        try {
            jobStore.updateJobStatus(message.jobId(), GradingJobStatus.SCORING);

            for (Long submissionId : message.submissionIds()) {
                try {
                    gradingService.ensureScoredResult(message.assignmentId(), submissionId);
                    jobStore.incrementJobProgress(message.jobId());
                } catch (Exception e) {
                    log.error("Failed to score submission {} for job {}", submissionId, message.jobId(), e);
                }
            }

            jobStore.updateJobStatus(message.jobId(), GradingJobStatus.COMPLETED);
            gradingService.notifyGradingJobCompleted(message.assignmentId(), message.submissionIds().size());
            log.info("Completed grading job {}", message.jobId());
        } catch (Exception e) {
            log.error("Failed to process grading job {}", message.jobId(), e);
            jobStore.updateJobStatus(message.jobId(), GradingJobStatus.FAILED);
        }
    }
}
