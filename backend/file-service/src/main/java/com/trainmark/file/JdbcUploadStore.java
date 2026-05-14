package com.trainmark.file;

import com.trainmark.shared.SubmissionStatus;
import com.trainmark.shared.dto.CompleteUploadRequest;
import com.trainmark.shared.dto.InitializeUploadRequest;
import com.trainmark.shared.dto.SubmissionReceipt;
import com.trainmark.shared.dto.SubmissionSummary;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.file.store", havingValue = "jdbc")
public class JdbcUploadStore implements UploadStore {
  private final String url;
  private final String username;
  private final String password;

  public JdbcUploadStore(
      @Value("${trainmark.file.jdbc.url:}") String url,
      @Value("${trainmark.file.jdbc.username:}") String username,
      @Value("${trainmark.file.jdbc.password:}") String password
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException("trainmark.file.jdbc.url is required when trainmark.file.store=jdbc");
    }
    this.url = url;
    this.username = username;
    this.password = password;
  }

  @Override
  public void saveUploadSession(String uploadId, InitializeUploadRequest request, String objectKey, OffsetDateTime expiresAt) {
    var sql = """
        INSERT INTO upload_sessions (
          upload_id, assignment_id, student_id, file_name, object_key, checksum, status, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setObject(1, UUID.fromString(uploadId));
      statement.setLong(2, request.assignmentId());
      statement.setLong(3, request.studentId());
      statement.setString(4, request.fileName());
      statement.setString(5, objectKey);
      statement.setString(6, request.checksum());
      statement.setString(7, "INITIALIZED");
      statement.setObject(8, expiresAt);
      statement.executeUpdate();
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to save upload session", error);
    }
  }

  @Override
  public SubmissionReceipt completeUpload(CompleteUploadRequest request) {
    try (var connection = connect()) {
      connection.setAutoCommit(false);
      try {
        var upload = findUpload(connection, request.uploadId());
        if (upload == null) {
          throw new IllegalArgumentException("Upload session not found: " + request.uploadId());
        }
        validateUpload(request, upload);
        var submittedAt = OffsetDateTime.now();
        var version = nextVersion(connection, upload.assignmentId(), upload.studentId());
        var submissionId = insertSubmission(connection, upload, version, submittedAt);
        markUploadCompleted(connection, request.uploadId());
        connection.commit();
        return new SubmissionReceipt(
            submissionId,
            upload.assignmentId(),
            upload.studentId(),
            upload.fileName(),
            upload.objectKey(),
            version,
            SubmissionStatus.SUBMITTED,
            submittedAt
        );
      } catch (SQLException | RuntimeException error) {
        connection.rollback();
        throw error;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to complete upload", error);
    }
  }

  @Override
  public Collection<SubmissionSummary> listSubmissions(Long assignmentId, Long studentId) {
    var sql = """
        SELECT s.id, s.assignment_id, s.student_id, u.name AS student_name, u.student_no,
               COALESCE(s.file_name, '未命名报告') AS file_name, s.version, s.status, s.submitted_at
        FROM submissions s
        LEFT JOIN users u ON u.id = s.student_id
        """;
    if (assignmentId != null || studentId != null) {
      sql += "WHERE ";
      if (assignmentId != null) {
        sql += "s.assignment_id = ?";
      }
      if (assignmentId != null && studentId != null) {
        sql += " AND ";
      }
      if (studentId != null) {
        sql += "s.student_id = ?";
      }
      sql += "\n";
    }
    sql += "ORDER BY s.submitted_at DESC";

    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      var index = 1;
      if (assignmentId != null) {
        statement.setLong(index++, assignmentId);
      }
      if (studentId != null) {
        statement.setLong(index, studentId);
      }
      try (var results = statement.executeQuery()) {
        var submissions = new ArrayList<SubmissionSummary>();
        while (results.next()) {
          submissions.add(new SubmissionSummary(
              results.getLong("id"),
              results.getLong("assignment_id"),
              results.getLong("student_id"),
              results.getString("student_name"),
              results.getString("student_no"),
              results.getString("file_name"),
              results.getInt("version"),
              SubmissionStatus.valueOf(results.getString("status")),
              results.getObject("submitted_at", OffsetDateTime.class)
          ));
        }
        return submissions;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to list submissions", error);
    }
  }

  @Override
  public SubmissionFileDescriptor getSubmissionFile(Long submissionId) {
    var sql = """
        SELECT id, COALESCE(file_name, '未命名报告') AS file_name, object_key
        FROM submissions
        WHERE id = ?
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, submissionId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return new SubmissionFileDescriptor(
              results.getLong("id"),
              results.getString("file_name"),
              results.getString("object_key")
          );
        }
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to find submission file", error);
    }
    throw new IllegalArgumentException("Submission file not found: " + submissionId);
  }

  private PendingUpload findUpload(Connection connection, String uploadId) throws SQLException {
    var sql = """
        SELECT upload_id, assignment_id, student_id, file_name, object_key, checksum, expires_at
        FROM upload_sessions
        WHERE upload_id = ? AND status = 'INITIALIZED'
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setObject(1, UUID.fromString(uploadId));
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return new PendingUpload(
              results.getString("upload_id"),
              results.getLong("assignment_id"),
              results.getLong("student_id"),
              results.getString("file_name"),
              results.getString("object_key"),
              results.getString("checksum"),
              results.getObject("expires_at", OffsetDateTime.class)
          );
        }
      }
    }
    return null;
  }

  private void validateUpload(CompleteUploadRequest request, PendingUpload upload) {
    if (upload.expiresAt().isBefore(OffsetDateTime.now())) {
      throw new IllegalArgumentException("Upload session has expired: " + upload.uploadId());
    }
    if (!upload.objectKey().equals(request.objectKey())) {
      throw new IllegalArgumentException("Upload object key does not match initialized session");
    }
    if (hasText(upload.checksum()) && hasText(request.checksum()) && !upload.checksum().equals(request.checksum())) {
      throw new IllegalArgumentException("Upload checksum does not match initialized session");
    }
  }

  private int nextVersion(Connection connection, Long assignmentId, Long studentId) throws SQLException {
    try (var statement = connection.prepareStatement(
        "SELECT COALESCE(max(version), 0) + 1 FROM submissions WHERE assignment_id = ? AND student_id = ?")) {
      statement.setLong(1, assignmentId);
      statement.setLong(2, studentId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return results.getInt(1);
        }
      }
    }
    return 1;
  }

  private Long insertSubmission(Connection connection, PendingUpload upload, int version, OffsetDateTime submittedAt) throws SQLException {
    var sql = """
        INSERT INTO submissions (
          assignment_id, student_id, file_name, object_key, status, submitted_at, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """;
    try (var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      statement.setLong(1, upload.assignmentId());
      statement.setLong(2, upload.studentId());
      statement.setString(3, upload.fileName());
      statement.setString(4, upload.objectKey());
      statement.setString(5, SubmissionStatus.SUBMITTED.name());
      statement.setObject(6, submittedAt);
      statement.setInt(7, version);
      statement.executeUpdate();
      try (var keys = statement.getGeneratedKeys()) {
        if (keys.next()) {
          return keys.getLong(1);
        }
      }
    }
    throw new SQLException("Insert did not return a generated submission id");
  }

  private void markUploadCompleted(Connection connection, String uploadId) throws SQLException {
    try (var statement = connection.prepareStatement("UPDATE upload_sessions SET status = 'COMPLETED' WHERE upload_id = ?")) {
      statement.setObject(1, UUID.fromString(uploadId));
      statement.executeUpdate();
    }
  }

  private Connection connect() throws SQLException {
    if (username == null || username.isBlank()) {
      return DriverManager.getConnection(url);
    }
    return DriverManager.getConnection(url, username, password);
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private record PendingUpload(
      String uploadId,
      Long assignmentId,
      Long studentId,
      String fileName,
      String objectKey,
      String checksum,
      OffsetDateTime expiresAt
  ) {}
}
