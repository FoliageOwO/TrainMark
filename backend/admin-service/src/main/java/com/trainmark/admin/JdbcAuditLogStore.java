package com.trainmark.admin;

import com.trainmark.shared.dto.AuditLogSummary;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.admin.store", havingValue = "jdbc")
public class JdbcAuditLogStore implements AuditLogStore {
  private final String url;
  private final String username;
  private final String password;

  public JdbcAuditLogStore(
      @Value("${trainmark.admin.jdbc.url:}") String url,
      @Value("${trainmark.admin.jdbc.username:}") String username,
      @Value("${trainmark.admin.jdbc.password:}") String password
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException("trainmark.admin.jdbc.url is required when trainmark.admin.store=jdbc");
    }
    this.url = url;
    this.username = username;
    this.password = password;
  }

  @Override
  public Collection<AuditLogSummary> list(String action, String resourceType) {
    var sql = """
        SELECT al.id, COALESCE(u.name, al.actor_name, '系统任务') AS actor_name, al.action, al.resource_type,
               al.resource_id, COALESCE(al.detail, '') AS detail, al.ip_address, al.created_at
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.actor_id
        """;
    if (action != null || resourceType != null) {
      sql += "WHERE ";
      if (action != null) {
        sql += "al.action = ?";
      }
      if (action != null && resourceType != null) {
        sql += " AND ";
      }
      if (resourceType != null) {
        sql += "al.resource_type = ?";
      }
      sql += "\n";
    }
    sql += "ORDER BY al.created_at DESC, al.id DESC";

    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      var index = 1;
      if (action != null) {
        statement.setString(index++, action);
      }
      if (resourceType != null) {
        statement.setString(index, resourceType);
      }
      try (var results = statement.executeQuery()) {
        var logs = new ArrayList<AuditLogSummary>();
        while (results.next()) {
          logs.add(new AuditLogSummary(
              results.getLong("id"),
              results.getString("actor_name"),
              results.getString("action"),
              results.getString("resource_type"),
              results.getString("resource_id"),
              results.getString("detail"),
              results.getString("ip_address"),
              results.getObject("created_at", OffsetDateTime.class)
          ));
        }
        return logs;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to load audit logs", error);
    }
  }

  @Override
  public AuditLogSummary add(String actorName, String action, String resourceType, String resourceId, String detail, String ipAddress) {
    var sql = """
        INSERT INTO audit_logs (actor_name, action, resource_type, resource_id, detail, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?, now())
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
      statement.setString(1, actorName);
      statement.setString(2, action);
      statement.setString(3, resourceType);
      statement.setString(4, resourceId);
      statement.setString(5, detail);
      statement.setString(6, ipAddress);
      statement.executeUpdate();
      try (var keys = statement.getGeneratedKeys()) {
        if (keys.next()) {
          return new AuditLogSummary(
              keys.getLong(1),
              actorName,
              action,
              resourceType,
              resourceId,
              detail,
              ipAddress,
              OffsetDateTime.now()
          );
        }
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to write audit log", error);
    }
    throw new IllegalStateException("Insert did not return a generated audit log id");
  }

  private java.sql.Connection connect() throws SQLException {
    if (username == null || username.isBlank()) {
      return DriverManager.getConnection(url);
    }
    return DriverManager.getConnection(url, username, password);
  }
}
