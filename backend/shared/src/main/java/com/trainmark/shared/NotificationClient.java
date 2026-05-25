package com.trainmark.shared;

import com.trainmark.shared.dto.CreateNotificationRequest;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collection;
import java.util.LinkedHashSet;

public class NotificationClient {
  private static final Duration TIMEOUT = Duration.ofSeconds(3);

  private final String notificationBaseUrl;
  private final boolean enabled;
  private final HttpClient httpClient;

  public NotificationClient(String notificationBaseUrl, boolean enabled) {
    this.notificationBaseUrl = normalizeBaseUrl(notificationBaseUrl);
    this.enabled = enabled && this.notificationBaseUrl != null;
    this.httpClient = HttpClient.newHttpClient();
  }

  public void sendNotification(
      Long assignmentId,
      Long recipientId,
      String title,
      String message,
      String type,
      String targetUrl
  ) {
    if (!enabled || recipientId == null) {
      return;
    }
    send(new CreateNotificationRequest(assignmentId, recipientId, title, message, type, targetUrl));
  }

  public void sendNotifications(
      Long assignmentId,
      Collection<Long> recipientIds,
      String title,
      String message,
      String type,
      String targetUrl
  ) {
    if (!enabled || recipientIds == null || recipientIds.isEmpty()) {
      return;
    }
    for (var recipientId : new LinkedHashSet<>(recipientIds)) {
      sendNotification(assignmentId, recipientId, title, message, type, targetUrl);
    }
  }

  private void send(CreateNotificationRequest request) {
    try {
      var httpRequest = HttpRequest.newBuilder()
          .uri(URI.create(notificationBaseUrl + "/api/notifications"))
          .timeout(TIMEOUT)
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(toJson(request)))
          .build();
      httpClient.sendAsync(httpRequest, HttpResponse.BodyHandlers.discarding())
          .exceptionally(error -> null);
    } catch (RuntimeException ignored) {
      // Notification delivery is best-effort and must not block the main workflow.
    }
  }

  private String toJson(CreateNotificationRequest request) {
    return """
        {"assignmentId":%s,"recipientId":%s,"title":"%s","message":"%s","type":"%s","targetUrl":%s}
        """.formatted(
        nullableNumber(request.assignmentId()),
        request.recipientId(),
        escape(request.title()),
        escape(request.message()),
        escape(request.type()),
        nullableString(request.targetUrl())
    );
  }

  private String nullableNumber(Long value) {
    return value == null ? "null" : value.toString();
  }

  private String nullableString(String value) {
    return value == null ? "null" : "\"" + escape(value) + "\"";
  }

  private String escape(String value) {
    if (value == null) {
      return "";
    }
    return value.replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", "\\n")
        .replace("\r", "\\r");
  }

  private static String normalizeBaseUrl(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
  }
}
