package com.trainmark.grading;

import com.trainmark.shared.AppealStatus;
import com.trainmark.shared.dto.AppealSummary;
import com.trainmark.shared.dto.CreateAppealRequest;
import com.trainmark.shared.dto.ResolveAppealRequest;
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
@ConditionalOnProperty(name = "trainmark.grading.appeal-store", havingValue = "jdbc")
public class JdbcAppealStore implements AppealStore {
  private final String url;
  private final String username;
  private final String password;

  public JdbcAppealStore(
      @Value("${trainmark.grading.jdbc.url:}") String url,
      @Value("${trainmark.grading.jdbc.username:}") String username,
      @Value("${trainmark.grading.jdbc.password:}") String password
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException("trainmark.grading.jdbc.url is required when trainmark.grading.appeal-store=jdbc");
    }
    this.url = url;
    this.username = username;
    this.password = password;
  }

  @Override
  public Collection<AppealSummary> listAppeals(Long resultId, Long studentId, AppealStatus status) {
    var sql = new StringBuilder("""
        SELECT a.id, a.result_id, a.rubric_item_id, a.student_id, u.name AS student_name,
               a.reason, a.requested_change, a.status, a.teacher_reply, a.created_at, a.resolved_at
        FROM grade_appeals a
        JOIN users u ON u.id = a.student_id
        WHERE 1 = 1
        """);
    var parameterIndex = 1;
    if (resultId != null) {
      sql.append("AND a.result_id = ?\n");
    }
    if (studentId != null) {
      sql.append("AND a.student_id = ?\n");
    }
    if (status != null) {
      sql.append("AND a.status = ?\n");
    }
    sql.append("ORDER BY a.created_at DESC, a.id DESC");

    try (var connection = connect();
        var statement = connection.prepareStatement(sql.toString())) {
      if (resultId != null) {
        statement.setLong(parameterIndex++, resultId);
      }
      if (studentId != null) {
        statement.setLong(parameterIndex++, studentId);
      }
      if (status != null) {
        statement.setString(parameterIndex, status.name());
      }
      try (var results = statement.executeQuery()) {
        var appeals = new ArrayList<AppealSummary>();
        while (results.next()) {
          appeals.add(mapAppeal(results));
        }
        return appeals;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to list grade appeals", error);
    }
  }

  @Override
  public AppealSummary createAppeal(CreateAppealRequest request, String studentName) {
    var sql = """
        INSERT INTO grade_appeals (
          result_id, rubric_item_id, student_id, reason, requested_change, status
        ) VALUES (?, ?, ?, ?, ?, ?)
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      statement.setLong(1, request.resultId());
      if (request.rubricItemId() == null) {
        statement.setObject(2, null);
      } else {
        statement.setLong(2, request.rubricItemId());
      }
      statement.setLong(3, request.studentId());
      statement.setString(4, request.reason());
      statement.setString(5, request.requestedChange());
      statement.setString(6, AppealStatus.SUBMITTED.name());
      statement.executeUpdate();
      try (var keys = statement.getGeneratedKeys()) {
        if (keys.next()) {
          return getAppeal(keys.getLong(1));
        }
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to create grade appeal", error);
    }
    throw new IllegalStateException("Insert did not return a generated grade appeal id");
  }

  @Override
  public AppealSummary resolveAppeal(Long appealId, ResolveAppealRequest request) {
    var sql = """
        UPDATE grade_appeals
        SET status = ?, teacher_reply = ?, resolved_at = now()
        WHERE id = ?
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setString(1, request.status().name());
      statement.setString(2, request.teacherReply());
      statement.setLong(3, appealId);
      var updated = statement.executeUpdate();
      if (updated == 0) {
        throw new IllegalArgumentException("Appeal not found: " + appealId);
      }
      return getAppeal(appealId);
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to resolve grade appeal", error);
    }
  }

  private AppealSummary getAppeal(Long appealId) throws SQLException {
    var sql = """
        SELECT a.id, a.result_id, a.rubric_item_id, a.student_id, u.name AS student_name,
               a.reason, a.requested_change, a.status, a.teacher_reply, a.created_at, a.resolved_at
        FROM grade_appeals a
        JOIN users u ON u.id = a.student_id
        WHERE a.id = ?
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, appealId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return mapAppeal(results);
        }
      }
    }
    throw new SQLException("Grade appeal not found: " + appealId);
  }

  private AppealSummary mapAppeal(java.sql.ResultSet results) throws SQLException {
    var rubricItemId = results.getLong("rubric_item_id");
    if (results.wasNull()) {
      rubricItemId = 0;
    }
    return new AppealSummary(
        results.getLong("id"),
        results.getLong("result_id"),
        rubricItemId == 0 ? null : rubricItemId,
        results.getLong("student_id"),
        results.getString("student_name"),
        results.getString("reason"),
        results.getString("requested_change"),
        AppealStatus.valueOf(results.getString("status")),
        results.getString("teacher_reply"),
        results.getObject("created_at", OffsetDateTime.class),
        results.getObject("resolved_at", OffsetDateTime.class)
    );
  }

  private java.sql.Connection connect() throws SQLException {
    if (username == null || username.isBlank()) {
      return DriverManager.getConnection(url);
    }
    return DriverManager.getConnection(url, username, password);
  }
}
