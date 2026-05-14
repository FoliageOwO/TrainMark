package com.trainmark.grading;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trainmark.shared.dto.GradingAnnotationSummary;
import com.trainmark.shared.dto.GradingResultSummary;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

public class CommandAnnotationProvider implements AnnotationProvider {
  private final String commandTemplate;
  private final String outputDir;
  private final Duration timeout;
  private final ObjectMapper objectMapper;

  public CommandAnnotationProvider(String commandTemplate, String outputDir, Duration timeout, ObjectMapper objectMapper) {
    this.commandTemplate = commandTemplate;
    this.outputDir = outputDir;
    this.timeout = timeout;
    this.objectMapper = objectMapper;
  }

  @Override
  public GradingResultSummary annotate(GradingResultSummary result) {
    var command = commandTemplate
        .replace("{resultId}", shellQuote(result.id().toString()))
        .replace("{submissionId}", shellQuote(result.submissionId().toString()))
        .replace("{studentName}", shellQuote(result.studentName()))
        .replace("{outputDir}", shellQuote(outputDir))
        .replace("{comment}", shellQuote(result.overallComment()));
    try {
      var process = new ProcessBuilder(shellCommand(command)).start();
      var completed = process.waitFor(timeout.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS);
      var stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
      var stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
      if (!completed) {
        process.destroyForcibly();
        throw new IllegalStateException("Annotation command timed out after " + timeout.toSeconds() + "s");
      }
      if (process.exitValue() != 0) {
        throw new IllegalStateException("Annotation command failed: " + stderr);
      }
      return withManifest(result, stdout);
    } catch (IOException exception) {
      throw new IllegalStateException("Failed to run annotation command", exception);
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Annotation command interrupted", exception);
    }
  }

  private GradingResultSummary withManifest(GradingResultSummary result, String stdout) throws IOException {
    var root = objectMapper.readTree(stdout);
    var annotationPdfUrl = root.path("annotationPdfUrl").asText();
    if (annotationPdfUrl == null || annotationPdfUrl.isBlank()) {
      throw new IllegalStateException("Annotation command did not return annotationPdfUrl");
    }
    return AnnotationProvider.withAnnotations(result, annotationPdfUrl, annotations(result.id(), root.path("annotations")));
  }

  private List<GradingAnnotationSummary> annotations(Long resultId, JsonNode nodes) {
    if (!nodes.isArray() || nodes.isEmpty()) {
      return List.of(new GradingAnnotationSummary(resultId, 1, "自动评分摘要", "批注 PDF 已生成", "info"));
    }
    var annotations = new ArrayList<GradingAnnotationSummary>();
    var index = 1L;
    for (var node : nodes) {
      var anchor = node.hasNonNull("anchorText") ? node.path("anchorText").asText() : node.path("anchor").asText("自动评分摘要");
      annotations.add(new GradingAnnotationSummary(
          resultId * 100 + index,
          node.path("page").asInt(1),
          anchor,
          node.path("comment").asText("批注 PDF 已生成"),
          node.path("severity").asText("info")
      ));
      index++;
    }
    return List.copyOf(annotations);
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
