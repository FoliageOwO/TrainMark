package com.trainmark.grading;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "trainmark.grading.export-async-enabled", havingValue = "true")
public class GradeExportQueueConfig {
  @Value("${trainmark.grading.export-queue.name:trainmark-grade-export-jobs}")
  private String queueName;

  @Value("${trainmark.grading.export-exchange.name:trainmark-grade-export-exchange}")
  private String exchangeName;

  @Value("${trainmark.grading.export-routing-key:grade.export.create}")
  private String routingKey;

  @Bean
  public Queue gradeExportQueue() {
    return new Queue(queueName, true);
  }

  @Bean
  public TopicExchange gradeExportExchange() {
    return new TopicExchange(exchangeName);
  }

  @Bean
  public Binding gradeExportBinding(Queue gradeExportQueue, TopicExchange gradeExportExchange) {
    return BindingBuilder.bind(gradeExportQueue).to(gradeExportExchange).with(routingKey);
  }

  @Bean
  @ConditionalOnMissingBean(MessageConverter.class)
  public MessageConverter gradeExportMessageConverter() {
    return new Jackson2JsonMessageConverter();
  }

  public String exchangeName() {
    return exchangeName;
  }

  public String routingKey() {
    return routingKey;
  }
}
