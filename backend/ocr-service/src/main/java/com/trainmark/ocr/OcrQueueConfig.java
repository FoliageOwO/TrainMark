package com.trainmark.ocr;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "trainmark.ocr.async-enabled", havingValue = "true")
public class OcrQueueConfig {
  @Value("${trainmark.ocr.queue.name:trainmark-ocr-jobs}")
  private String queueName;

  @Value("${trainmark.ocr.exchange.name:trainmark-ocr-exchange}")
  private String exchangeName;

  @Value("${trainmark.ocr.routing-key:ocr.job.create}")
  private String routingKey;

  @Bean
  public Queue ocrQueue() {
    return new Queue(queueName, true);
  }

  @Bean
  public TopicExchange ocrExchange() {
    return new TopicExchange(exchangeName);
  }

  @Bean
  public Binding ocrBinding(Queue ocrQueue, TopicExchange ocrExchange) {
    return BindingBuilder.bind(ocrQueue).to(ocrExchange).with(routingKey);
  }

  @Bean
  public MessageConverter ocrMessageConverter() {
    return new Jackson2JsonMessageConverter();
  }

  public String exchangeName() {
    return exchangeName;
  }

  public String routingKey() {
    return routingKey;
  }
}
