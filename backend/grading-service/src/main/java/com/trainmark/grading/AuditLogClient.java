package com.trainmark.grading;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * HTTP client that writes audit logs to the admin service.
 * Gracefully degrades if the admin service is unavailable.
 */
@Component
public class AuditLogClient {
  private static final Logger log = LoggerFactory.getLogger(AuditLogClient.class);
  private static final Duration TIMEOUT = Duration.ofSeconds(3);

  private final String adminBaseUrl;
  private final boolean enabled;
  private final HttpClient httpClient;

  public AuditLogClient(
      @Value("${trainmark.admin.base-url:http://localhost:8090}") String adminBaseUrl,
      @Value("${trainmark.admin.audit-enabled:true}") boolean enabled
  ) {
    this.adminBaseUrl = adminBaseUrl;
    this.enabled = enabled;
    this.httpClient = HttpClient.newHttpClient();
  }

  /**
   * Writes an audit log entry asynchronously (best-effort).
   * Returns silently if the admin service is unavailable.
   */
  public void log(String actorName, String action, String resourceType,
                  String resourceId, String detail, String ipAddress) {
    if (!enabled) {
      return;
    }

    var body = """
        {"actorName":"%s","action":"%s","resourceType":"%s","resourceId":"%s","detail":"%s","ipAddress":"%s"}
        """.formatted(
        escape(actorName), escape(action), escape(resourceType),
        escape(resourceId), escape(detail), escape(ipAddress)
    );

    var request = HttpRequest.newBuilder()
        .uri(URI.create(adminBaseUrl + "/api/admin/audit-logs"))
        .timeout(TIMEOUT)
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();

    httpClient.sendAsync(request, HttpResponse.BodyHandlers.discarding())
        .thenAccept(response -> {
          if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.debug("Audit log written: {} - {}", action, resourceType);
          } else {
            log.warn("Audit log rejected by admin service ({}): {} - {}",
                response.statusCode(), action, resourceType);
          }
        })
        .exceptionally(error -> {
          log.debug("Audit log write failed (admin service unavailable): {}", error.getMessage());
          return null;
        });
  }

  private String escape(String value) {
    if (value == null) return "";
    return value.replace("\\", "\\\\").replace("\"", "\\\"")
        .replace("\n", "\\n").replace("\r", "\\r");
  }
}
