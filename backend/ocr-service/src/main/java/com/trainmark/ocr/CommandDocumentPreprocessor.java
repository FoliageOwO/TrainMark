package com.trainmark.ocr;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trainmark.shared.dto.CreateOcrJobRequest;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Duration;

public class CommandDocumentPreprocessor implements DocumentPreprocessor {
  private final String commandTemplate;
  private final Duration timeout;
  private final ObjectMapper objectMapper;

  public CommandDocumentPreprocessor(String commandTemplate, Duration timeout, ObjectMapper objectMapper) {
    this.commandTemplate = commandTemplate;
    this.timeout = timeout;
    this.objectMapper = objectMapper;
  }

  @Override
  public DocumentPreprocessResult preprocess(CreateOcrJobRequest request) {
    var command = commandTemplate
        .replace("{submissionId}", shellQuote(request.submissionId().toString()))
        .replace("{objectKey}", shellQuote(request.objectKey()));
    try {
      var processBuilder = new ProcessBuilder(shellCommand(command));
      processBuilder.directory(workspaceRoot().toFile());
      var process = processBuilder.start();
      var completed = process.waitFor(timeout.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS);
      var stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
      var stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
      if (!completed) {
        process.destroyForcibly();
        throw new IllegalStateException("Document preprocessing command timed out after " + timeout.toSeconds() + "s");
      }
      if (process.exitValue() != 0) {
        throw new IllegalStateException("Document preprocessing command failed: " + stderr);
      }
      return parseResult(stdout);
    } catch (IOException exception) {
      throw new IllegalStateException("Failed to run document preprocessing command", exception);
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Document preprocessing command interrupted", exception);
    }
  }

  private DocumentPreprocessResult parseResult(String stdout) throws IOException {
    var root = objectMapper.readTree(stdout);
    return new DocumentPreprocessResult(
        requiredText(root, "sourceObjectKey"),
        requiredText(root, "normalizedObjectKey"),
        requiredText(root, "sourceFormat"),
        requiredText(root, "targetFormat"),
        requiredInt(root, "pageCount"),
        requiredInt(root, "imageCount"),
        requiredInt(root, "tableHintCount")
    );
  }

  private String requiredText(JsonNode root, String field) {
    var value = root.get(field);
    if (value == null || !value.isTextual() || value.asText().isBlank()) {
      throw new IllegalStateException("Document preprocessing output missing text field: " + field);
    }
    return value.asText();
  }

  private int requiredInt(JsonNode root, String field) {
    var value = root.get(field);
    if (value == null || !value.canConvertToInt()) {
      throw new IllegalStateException("Document preprocessing output missing integer field: " + field);
    }
    return value.asInt();
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

  private Path workspaceRoot() {
    var current = Path.of(System.getProperty("user.dir")).toAbsolutePath();
    var cursor = current;
    while (cursor != null) {
      if (cursor.resolve("ai/document/local_converter.py").toFile().exists()) {
        return cursor;
      }
      cursor = cursor.getParent();
    }
    return current;
  }
}
