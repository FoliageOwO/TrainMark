package com.trainmark.grading;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trainmark.shared.dto.GradingResultSummary;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;

public class HttpScoringProvider implements ScoringProvider {
  private final URI endpoint;
  private final String apiKey;
  private final Duration timeout;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public HttpScoringProvider(String endpoint, String apiKey, Duration timeout, ObjectMapper objectMapper) {
    if (endpoint == null || endpoint.isBlank()) {
      throw new IllegalStateException(
          "trainmark.scoring.endpoint is required when trainmark.scoring.provider=semantic-http");
    }
    this.endpoint = URI.create(endpoint);
    this.apiKey = apiKey;
    this.timeout = timeout;
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newBuilder().connectTimeout(timeout).build();
  }

  @Override
  public GradingResultSummary score(ScoringRequest request) {
    var body = new LinkedHashMap<String, Object>();
    body.put("resultId", request.resultId());
    body.put("assignmentId", request.assignmentId());
    body.put("submissionId", request.submissionId());
    body.put("studentId", request.studentId());
    body.put("studentName", request.studentName());
    body.put("studentNo", request.studentNo());
    body.put("fileName", request.fileName());
    body.put("fileContentText", request.fileContentText());
    body.put("rubric", request.rubric());

    try {
      var builder = HttpRequest.newBuilder(endpoint)
          .timeout(timeout)
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)));
      if (apiKey != null && !apiKey.isBlank()) {
        builder.header("Authorization", "Bearer " + apiKey);
      }
      var response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        throw new IllegalStateException(
            "Semantic scoring service failed with HTTP " + response.statusCode() + ": " + response.body());
      }
      return readResult(response.body());
    } catch (IOException exception) {
      throw new IllegalStateException("Failed to call semantic scoring service", exception);
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Semantic scoring service call interrupted", exception);
    }
  }

  private GradingResultSummary readResult(String body) throws IOException {
    var root = objectMapper.readTree(body);
    var payload = unwrapApiResponse(root);
    return objectMapper.treeToValue(payload, GradingResultSummary.class);
  }

  private JsonNode unwrapApiResponse(JsonNode root) {
    if (root.has("success") && root.has("data")) {
      if (!root.path("success").asBoolean(false)) {
        throw new IllegalStateException("Semantic scoring service returned failure: " + root.path("message").asText());
      }
      return root.path("data");
    }
    return root;
  }
}
