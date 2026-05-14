package com.trainmark.ocr;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OcrProviderConfig {
  @Bean
  OcrProvider ocrProvider(
      @Value("${trainmark.ocr.provider:local}") String provider,
      @Value("${trainmark.ocr.command:}") String command,
      @Value("${trainmark.ocr.timeout-seconds:60}") long timeoutSeconds,
      ObjectMapper objectMapper
  ) {
    if ("command".equalsIgnoreCase(provider)) {
      if (command == null || command.isBlank()) {
        throw new IllegalStateException("trainmark.ocr.command is required when trainmark.ocr.provider=command");
      }
      return new CommandOcrProvider(command, Duration.ofSeconds(timeoutSeconds), objectMapper);
    }
    return new LocalOcrProvider();
  }
}
