package com.trainmark.grading;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AnnotationProviderConfig {
  @Bean
  AnnotationProvider annotationProvider(
      @Value("${trainmark.annotation.provider:local}") String provider,
      @Value("${trainmark.annotation.command:}") String command,
      @Value("${trainmark.annotation.output-dir:/tmp/trainmark-annotations}") String outputDir,
      @Value("${trainmark.annotation.timeout-seconds:60}") long timeoutSeconds,
      ObjectMapper objectMapper
  ) {
    if ("command".equalsIgnoreCase(provider)) {
      if (command == null || command.isBlank()) {
        throw new IllegalStateException("trainmark.annotation.command is required when trainmark.annotation.provider=command");
      }
      return new CommandAnnotationProvider(command, outputDir, Duration.ofSeconds(timeoutSeconds), objectMapper);
    }
    return new LocalAnnotationProvider();
  }
}
