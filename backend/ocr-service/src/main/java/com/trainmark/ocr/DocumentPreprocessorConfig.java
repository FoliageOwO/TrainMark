package com.trainmark.ocr;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DocumentPreprocessorConfig {
  @Bean
  DocumentPreprocessor documentPreprocessor(
      @Value("${trainmark.document.preprocessor.provider:local}") String provider,
      @Value("${trainmark.document.preprocessor.command:}") String command,
      @Value("${trainmark.document.preprocessor.timeout-seconds:60}") long timeoutSeconds,
      ObjectMapper objectMapper
  ) {
    if ("command".equalsIgnoreCase(provider)) {
      if (command == null || command.isBlank()) {
        throw new IllegalArgumentException("DOCUMENT_PREPROCESSOR_COMMAND is required when DOCUMENT_PREPROCESSOR_PROVIDER=command");
      }
      return new CommandDocumentPreprocessor(command, Duration.ofSeconds(timeoutSeconds), objectMapper);
    }
    if (!"local".equalsIgnoreCase(provider)) {
      throw new IllegalArgumentException("Unsupported document preprocessor provider: " + provider);
    }
    return new LocalDocumentPreprocessor();
  }
}
