package com.trainmark.grading;

import com.trainmark.shared.dto.GradePublicationAuditEntry;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.grading.publication-audit-store", havingValue = "jdbc")
public class JdbcGradePublicationAuditStore implements GradePublicationAuditStore {
  private final String url;
  private final String username;
  private final String password;

  public JdbcGradePublicationAuditStore(
      @Value("${trainmark.grading.jdbc.url:}") String url,
      @Value("${trainmark.grading.jdbc.username:}") String username,
      @Value("${trainmark.grading.jdbc.password:}") String password
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException(
          "trainmark.grading.jdbc.url is required when trainmark.grading.publication-audit-store=jdbc"
      );
    }
    this.url = url;
    this.username = username;
    this.password = password;
  }

  @Override
  public Collection<GradePublicationAuditEntry> listPublicationAudits(Long resultId) {
    var sql = """
        SELECT id, result_id, action, operator_name, reason, created_at
        FROM grade_publication_audits
        WHERE result_id = ?
        ORDER BY created_at ASC, id ASC
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, resultId);
      try (var results = statement.executeQuery()) {
        var audits = new ArrayList<GradePublicationAuditEntry>();
        while (results.next()) {
          audits.add(mapAudit(results));
        }
        return audits;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to list grade publication audits", error);
    }
  }

  @Override
  public GradePublicationAuditEntry appendPublicationAudit(
      Long resultId,
      String action,
      String operatorName,
      String reason
  ) {
    var sql = """
        INSERT INTO grade_publication_audits (result_id, action, operator_name, reason)
        VALUES (?, ?, ?, ?)
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      statement.setLong(1, resultId);
      statement.setString(2, action);
      statement.setString(3, operatorName);
      statement.setString(4, reason);
      statement.executeUpdate();
      try (var keys = statement.getGeneratedKeys()) {
        if (keys.next()) {
          return getPublicationAudit(keys.getLong(1));
        }
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to append grade publication audit", error);
    }
    throw new IllegalStateException("Insert did not return a generated grade publication audit id");
  }

  private GradePublicationAuditEntry getPublicationAudit(Long auditId) throws SQLException {
    var sql = """
        SELECT id, result_id, action, operator_name, reason, created_at
        FROM grade_publication_audits
        WHERE id = ?
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, auditId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return mapAudit(results);
        }
      }
    }
    throw new SQLException("Grade publication audit not found: " + auditId);
  }

  private GradePublicationAuditEntry mapAudit(java.sql.ResultSet results) throws SQLException {
    return new GradePublicationAuditEntry(
        results.getLong("id"),
        results.getLong("result_id"),
        results.getString("action"),
        results.getString("operator_name"),
        results.getString("reason"),
        results.getObject("created_at", OffsetDateTime.class)
    );
  }

  private java.sql.Connection connect() throws SQLException {
    if (username == null || username.isBlank()) {
      return DriverManager.getConnection(url);
    }
    return DriverManager.getConnection(url, username, password);
  }
}
