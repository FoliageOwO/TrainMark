package com.trainmark.grading;

import java.util.List;

/**
 * Message sent to RabbitMQ for async grading job processing.
 */
public record GradingJobMessage(
        Long jobId,
        Long assignmentId,
        Long rubricId,
        List<Long> submissionIds
) {}
