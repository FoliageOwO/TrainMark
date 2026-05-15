package com.trainmark.grading;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ScoringProviderConfig {
  private static final String DEFAULT_SEMANTIC_COMMAND = String.join(" ",
      "python3 ai/scoring/semantic_provider.py",
      "--result-id {resultId}",
      "--assignment-id {assignmentId}",
      "--submission-id {submissionId}",
      "--student-id {studentId}",
      "--student-name {studentName}",
      "--student-no {studentNo}",
      "--file-name {fileName}",
      "--rubric-json {rubricJson}");

  @Bean
  ScoringProvider scoringProvider(
      @Value("${trainmark.scoring.provider:local}") String provider,
      @Value("${trainmark.scoring.command:}") String command,
      @Value("${trainmark.scoring.require-real:false}") boolean requireReal,
      @Value("${trainmark.scoring.timeout-seconds:90}") long timeoutSeconds,
      ObjectMapper objectMapper
  ) {
    if ("command".equalsIgnoreCase(provider)) {
      if (command == null || command.isBlank()) {
        throw new IllegalStateException("trainmark.scoring.command is required when trainmark.scoring.provider=command");
      }
      return new CommandScoringProvider(command, Duration.ofSeconds(timeoutSeconds), objectMapper);
    }
    if ("semantic".equalsIgnoreCase(provider)) {
      var semanticCommand = command == null || command.isBlank() ? DEFAULT_SEMANTIC_COMMAND : command;
      if (requireReal && (command == null || command.isBlank())) {
        semanticCommand += " --require-real";
      }
      return new CommandScoringProvider(semanticCommand, Duration.ofSeconds(timeoutSeconds), objectMapper);
    }
    return new LocalScoringProvider();
  }
}
