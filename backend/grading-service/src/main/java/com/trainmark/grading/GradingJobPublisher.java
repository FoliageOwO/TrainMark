package com.trainmark.grading;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Publishes grading jobs to RabbitMQ for async processing.
 */
@Component
@ConditionalOnProperty(name = "trainmark.grading.async-enabled", havingValue = "true")
public class GradingJobPublisher {
    private static final Logger log = LoggerFactory.getLogger(GradingJobPublisher.class);

    private final RabbitTemplate rabbitTemplate;
    private final GradingQueueConfig queueConfig;

    public GradingJobPublisher(RabbitTemplate rabbitTemplate, GradingQueueConfig queueConfig) {
        this.rabbitTemplate = rabbitTemplate;
        this.queueConfig = queueConfig;
    }

    public void publish(GradingJobMessage message) {
        rabbitTemplate.convertAndSend(
                queueConfig.getExchangeName(),
                queueConfig.getRoutingKey(),
                message
        );
        log.info("Published grading job {} to queue for {} submissions",
                message.jobId(), message.submissionIds().size());
    }
}
