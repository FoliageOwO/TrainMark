package com.trainmark.grading;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trainmark.shared.dto.GradingResultSummary;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

public class CommandScoringProvider implements ScoringProvider {
  private final String commandTemplate;
  private final Duration timeout;
  private final ObjectMapper objectMapper;

  public CommandScoringProvider(String commandTemplate, Duration timeout, ObjectMapper objectMapper) {
    this.commandTemplate = commandTemplate;
    this.timeout = timeout;
    this.objectMapper = objectMapper;
  }

  @Override
  public GradingResultSummary score(ScoringRequest request) {
    var command = commandTemplate
        .replace("{resultId}", shellQuote(request.resultId().toString()))
        .replace("{assignmentId}", shellQuote(request.assignmentId().toString()))
        .replace("{submissionId}", shellQuote(request.submissionId().toString()))
        .replace("{studentId}", shellQuote(request.studentId().toString()))
        .replace("{studentName}", shellQuote(request.studentName()))
        .replace("{studentNo}", shellQuote(request.studentNo()))
        .replace("{fileName}", shellQuote(request.fileName()));
    try {
      var process = new ProcessBuilder(shellCommand(command)).start();
      var completed = process.waitFor(timeout.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS);
      var stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
      var stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
      if (!completed) {
        process.destroyForcibly();
        throw new IllegalStateException("Scoring command timed out after " + timeout.toSeconds() + "s");
      }
      if (process.exitValue() != 0) {
        throw new IllegalStateException("Scoring command failed: " + stderr);
      }
      return objectMapper.readValue(stdout, GradingResultSummary.class);
    } catch (IOException exception) {
      throw new IllegalStateException("Failed to run scoring command", exception);
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Scoring command interrupted", exception);
    }
  }

  private String[] shellCommand(String command) {
    if (System.getProperty("os.name").toLowerCase().contains("win")) {
      return new String[] {"cmd.exe", "/c", command};
    }
    return new String[] {"bash", "-lc", command};
  }

  private String shellQuote(String value) {
    if (System.getProperty("os.name").toLowerCase().contains("win")) {
      return "\"" + value.replace("\"", "\\\"") + "\"";
    }
    return "'" + value.replace("'", "'\"'\"'") + "'";
  }
}
