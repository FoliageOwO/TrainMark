package com.trainmark.ocr;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OcrProviderConfig {
  private static final String DEFAULT_PADDLEOCR_COMMAND = String.join(" ",
      "python3 ai/ocr/paddleocr_provider.py",
      "--job-id {jobId}",
      "--submission-id {submissionId}",
      "--object-key {objectKey}",
      "--normalized-object-key {normalizedObjectKey}");

  @Bean
  OcrProvider ocrProvider(
      @Value("${trainmark.ocr.provider:local}") String provider,
      @Value("${trainmark.ocr.command:}") String command,
      @Value("${trainmark.ocr.endpoint:}") String endpoint,
      @Value("${trainmark.ocr.api-key:}") String apiKey,
      @Value("${trainmark.ocr.require-real:false}") boolean requireReal,
      @Value("${trainmark.ocr.timeout-seconds:60}") long timeoutSeconds,
      ObjectMapper objectMapper
  ) {
    if ("paddleocr-http".equalsIgnoreCase(provider)) {
      return new HttpOcrProvider(endpoint, apiKey, Duration.ofSeconds(timeoutSeconds), objectMapper);
    }
    if ("command".equalsIgnoreCase(provider)) {
      if (command == null || command.isBlank()) {
        throw new IllegalStateException("trainmark.ocr.command is required when trainmark.ocr.provider=command");
      }
      return new CommandOcrProvider(command, Duration.ofSeconds(timeoutSeconds), objectMapper);
    }
    if ("paddleocr".equalsIgnoreCase(provider)) {
      var paddleCommand = command == null || command.isBlank() ? DEFAULT_PADDLEOCR_COMMAND : command;
      if (requireReal && (command == null || command.isBlank())) {
        paddleCommand += " --require-real";
      }
      return new CommandOcrProvider(paddleCommand, Duration.ofSeconds(timeoutSeconds), objectMapper);
    }
    return new LocalOcrProvider();
  }
}
