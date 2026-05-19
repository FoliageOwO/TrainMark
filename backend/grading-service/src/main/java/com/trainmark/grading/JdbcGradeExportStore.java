package com.trainmark.grading;

import com.trainmark.shared.dto.CreateGradeExportRequest;
import com.trainmark.shared.dto.GradeExportSummary;
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
@ConditionalOnProperty(name = "trainmark.grading.export-store", havingValue = "jdbc")
public class JdbcGradeExportStore implements GradeExportStore {
  private final String url;
  private final String username;
  private final String password;

  public JdbcGradeExportStore(
      @Value("${trainmark.grading.jdbc.url:}") String url,
      @Value("${trainmark.grading.jdbc.username:}") String username,
      @Value("${trainmark.grading.jdbc.password:}") String password
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException("trainmark.grading.jdbc.url is required when trainmark.grading.export-store=jdbc");
    }
    this.url = url;
    this.username = username;
    this.password = password;
  }

  @Override
  public Collection<GradeExportSummary> listGradeExports(Long assignmentId) {
    var sql = """
        SELECT id, assignment_id, file_name, format, row_count, download_url, status, created_at
        FROM grade_exports
        """;
    if (assignmentId != null) {
      sql += "WHERE assignment_id = ?\n";
    }
    sql += "ORDER BY created_at DESC, id DESC";

    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      if (assignmentId != null) {
        statement.setLong(1, assignmentId);
      }
      try (var results = statement.executeQuery()) {
        var exports = new ArrayList<GradeExportSummary>();
        while (results.next()) {
          exports.add(mapExport(results));
        }
        return exports;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to list grade exports", error);
    }
  }

  @Override
  public GradeExportSummary createGradeExport(CreateGradeExportRequest request, int rowCount) {
    return createGradeExport(request, rowCount, "READY");
  }

  @Override
  public GradeExportSummary createGradeExport(CreateGradeExportRequest request, int rowCount, String status) {
    var format = request.format().toUpperCase();
    var suffix = suffix(format);
    var sql = """
        INSERT INTO grade_exports (
          assignment_id, file_name, format, row_count, download_url, status, operator_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      statement.setLong(1, request.assignmentId());
      statement.setString(2, "assignment-%d-grades.%s".formatted(request.assignmentId(), suffix));
      statement.setString(3, format);
      statement.setInt(4, rowCount);
      statement.setString(5, "/exports/assignments/%d/grades-pending.%s".formatted(request.assignmentId(), suffix));
      statement.setString(6, status);
      statement.setString(7, request.operatorName());
      statement.executeUpdate();
      try (var keys = statement.getGeneratedKeys()) {
        if (keys.next()) {
          var exportId = keys.getLong(1);
          updateDownloadUrl(connection, exportId, request.assignmentId(), suffix);
          return getExport(exportId);
        }
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to create grade export", error);
    }
    throw new IllegalStateException("Insert did not return a generated grade export id");
  }

  @Override
  public GradeExportSummary markGradeExportReady(Long exportId, int rowCount) {
    try (var connection = connect()) {
      var export = getExport(exportId);
      updateExportStatus(connection, exportId, rowCount, "READY");
      return getExport(exportId);
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to mark grade export ready", error);
    }
  }

  @Override
  public void markGradeExportFailed(Long exportId) {
    try (var connection = connect()) {
      var export = getExport(exportId);
      updateExportStatus(connection, exportId, export.rowCount(), "FAILED");
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to mark grade export failed", error);
    }
  }

  private void updateExportStatus(
      java.sql.Connection connection,
      Long exportId,
      int rowCount,
      String status
  ) throws SQLException {
    var sql = """
        UPDATE grade_exports
        SET row_count = ?, status = ?
        WHERE id = ?
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setInt(1, rowCount);
      statement.setString(2, status);
      statement.setLong(3, exportId);
      statement.executeUpdate();
    }
  }

  private void updateDownloadUrl(
      java.sql.Connection connection,
      Long exportId,
      Long assignmentId,
      String suffix
  ) throws SQLException {
    var sql = """
        UPDATE grade_exports
        SET download_url = ?
        WHERE id = ?
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setString(1, "/exports/assignments/%d/grades-%d.%s".formatted(assignmentId, exportId, suffix));
      statement.setLong(2, exportId);
      statement.executeUpdate();
    }
  }

  private GradeExportSummary getExport(Long exportId) throws SQLException {
    var sql = """
        SELECT id, assignment_id, file_name, format, row_count, download_url, status, created_at
        FROM grade_exports
        WHERE id = ?
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, exportId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return mapExport(results);
        }
      }
    }
    throw new SQLException("Grade export not found: " + exportId);
  }

  private GradeExportSummary mapExport(java.sql.ResultSet results) throws SQLException {
    return new GradeExportSummary(
        results.getLong("id"),
        results.getLong("assignment_id"),
        results.getString("file_name"),
        results.getString("format"),
        results.getInt("row_count"),
        results.getString("download_url"),
        results.getString("status"),
        results.getObject("created_at", OffsetDateTime.class)
    );
  }

  private String suffix(String format) {
    return switch (format) {
      case "PDF" -> "pdf";
      case "ZIP" -> "zip";
      default -> "csv";
    };
  }

  private java.sql.Connection connect() throws SQLException {
    if (username == null || username.isBlank()) {
      return DriverManager.getConnection(url);
    }
    return DriverManager.getConnection(url, username, password);
  }
}
