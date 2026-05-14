package com.trainmark.ocr;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trainmark.shared.dto.CreateOcrJobRequest;
import com.trainmark.shared.dto.OcrResultSummary;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

public class CommandOcrProvider implements OcrProvider {
  private final String commandTemplate;
  private final Duration timeout;
  private final ObjectMapper objectMapper;

  public CommandOcrProvider(String commandTemplate, Duration timeout, ObjectMapper objectMapper) {
    this.commandTemplate = commandTemplate;
    this.timeout = timeout;
    this.objectMapper = objectMapper;
  }

  @Override
  public OcrResultSummary recognize(Long jobId, CreateOcrJobRequest request) {
    var command = commandTemplate
        .replace("{jobId}", shellQuote(jobId.toString()))
        .replace("{submissionId}", shellQuote(request.submissionId().toString()))
        .replace("{objectKey}", shellQuote(request.objectKey()));
    try {
      var process = new ProcessBuilder(shellCommand(command)).start();
      var completed = process.waitFor(timeout.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS);
      var stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
      var stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
      if (!completed) {
        process.destroyForcibly();
        throw new IllegalStateException("OCR command timed out after " + timeout.toSeconds() + "s");
      }
      if (process.exitValue() != 0) {
        throw new IllegalStateException("OCR command failed: " + stderr);
      }
      return objectMapper.readValue(stdout, OcrResultSummary.class);
    } catch (IOException exception) {
      throw new IllegalStateException("Failed to run OCR command", exception);
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("OCR command interrupted", exception);
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
