package com.trainmark.ocr;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trainmark.shared.dto.CreateOcrJobRequest;
import com.trainmark.shared.dto.OcrResultSummary;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

public class HttpOcrProvider implements OcrProvider {
  private final URI endpoint;
  private final String apiKey;
  private final Duration timeout;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public HttpOcrProvider(String endpoint, String apiKey, Duration timeout, ObjectMapper objectMapper) {
    if (endpoint == null || endpoint.isBlank()) {
      throw new IllegalStateException("trainmark.ocr.endpoint is required when trainmark.ocr.provider=paddleocr-http");
    }
    this.endpoint = URI.create(endpoint);
    this.apiKey = apiKey;
    this.timeout = timeout;
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newBuilder().connectTimeout(timeout).build();
  }

  @Override
  public OcrResultSummary recognize(Long jobId, CreateOcrJobRequest request, DocumentPreprocessResult document) {
    var body = new LinkedHashMap<String, Object>();
    body.put("jobId", jobId);
    body.put("submissionId", request.submissionId());
    body.put("objectKey", request.objectKey());
    body.put("mode", request.mode());
    body.put("normalizedObjectKey", document.normalizedObjectKey());
    body.put("sourceObjectKey", document.sourceObjectKey());
    body.put("sourceFormat", document.sourceFormat());
    body.put("targetFormat", document.targetFormat());
    body.put("pageCount", document.pageCount());
    body.put("imageCount", document.imageCount());
    body.put("tableHintCount", document.tableHintCount());

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
        throw new IllegalStateException("PaddleOCR service failed with HTTP " + response.statusCode() + ": " + response.body());
      }
      return readResult(response.body());
    } catch (IOException exception) {
      throw new IllegalStateException("Failed to call PaddleOCR service", exception);
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("PaddleOCR service call interrupted", exception);
    }
  }

  private OcrResultSummary readResult(String body) throws IOException {
    var root = objectMapper.readTree(body);
    var payload = unwrapApiResponse(root);
    return objectMapper.treeToValue(payload, OcrResultSummary.class);
  }

  private JsonNode unwrapApiResponse(JsonNode root) {
    if (root.has("success") && root.has("data")) {
      if (!root.path("success").asBoolean(false)) {
        throw new IllegalStateException("PaddleOCR service returned failure: " + root.path("message").asText());
      }
      return root.path("data");
    }
    return root;
  }
}
