package com.trainmark.notification;

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
@ConditionalOnProperty(name = "trainmark.notification.async-enabled", havingValue = "true")
public class NotificationQueueConfig {
  @Value("${trainmark.notification.queue.name:trainmark-notification-jobs}")
  private String queueName;

  @Value("${trainmark.notification.exchange.name:trainmark-notification-exchange}")
  private String exchangeName;

  @Value("${trainmark.notification.routing-key:notification.reminder.send}")
  private String routingKey;

  @Bean
  public Queue notificationQueue() {
    return new Queue(queueName, true);
  }

  @Bean
  public TopicExchange notificationExchange() {
    return new TopicExchange(exchangeName);
  }

  @Bean
  public Binding notificationBinding(Queue notificationQueue, TopicExchange notificationExchange) {
    return BindingBuilder.bind(notificationQueue).to(notificationExchange).with(routingKey);
  }

  @Bean
  public MessageConverter notificationMessageConverter() {
    return new Jackson2JsonMessageConverter();
  }

  public String exchangeName() {
    return exchangeName;
  }

  public String routingKey() {
    return routingKey;
  }
}
