package com.trainmark.grading;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "trainmark.grading.async-enabled", havingValue = "true")
public class GradingQueueConfig {

    @Value("${trainmark.grading.queue.name:trainmark-grading-jobs}")
    private String queueName;

    @Value("${trainmark.grading.exchange.name:trainmark-grading-exchange}")
    private String exchangeName;

    @Value("${trainmark.grading.routing-key:grading.job.create}")
    private String routingKey;

    @Bean
    public Queue gradingQueue() {
        return new Queue(queueName, true);
    }

    @Bean
    public TopicExchange gradingExchange() {
        return new TopicExchange(exchangeName);
    }

    @Bean
    public Binding gradingBinding(Queue gradingQueue, TopicExchange gradingExchange) {
        return BindingBuilder.bind(gradingQueue).to(gradingExchange).with(routingKey);
    }

    public String getRoutingKey() {
        return routingKey;
    }

    public String getExchangeName() {
        return exchangeName;
    }
}
