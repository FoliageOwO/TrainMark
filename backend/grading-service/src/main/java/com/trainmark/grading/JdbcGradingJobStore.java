package com.trainmark.grading;

import com.trainmark.shared.GradingJobStatus;
import com.trainmark.shared.dto.CreateGradingJobRequest;
import com.trainmark.shared.dto.GradingJobSummary;
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
@ConditionalOnProperty(name = "trainmark.grading.job-store", havingValue = "jdbc")
public class JdbcGradingJobStore implements GradingJobStore {
  private final String url;
  private final String username;
  private final String password;

  public JdbcGradingJobStore(
      @Value("${trainmark.grading.jdbc.url:}") String url,
      @Value("${trainmark.grading.jdbc.username:}") String username,
      @Value("${trainmark.grading.jdbc.password:}") String password
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException("trainmark.grading.jdbc.url is required when trainmark.grading.job-store=jdbc");
    }
    this.url = url;
    this.username = username;
    this.password = password;
  }

  @Override
  public Collection<GradingJobSummary> listJobs(Long assignmentId) {
    var sql = """
        SELECT id, assignment_id, rubric_id, total_submission_count, processed_submission_count,
               status, created_at, started_at, finished_at, updated_at
        FROM grading_jobs
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
        var jobs = new ArrayList<GradingJobSummary>();
        while (results.next()) {
          jobs.add(mapJob(results));
        }
        return jobs;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to list grading jobs", error);
    }
  }

  @Override
  public GradingJobSummary createJob(CreateGradingJobRequest request) {
    var sql = """
        INSERT INTO grading_jobs (
          assignment_id, rubric_id, status, total_submission_count,
          processed_submission_count, failed_submission_count, started_at
        ) VALUES (?, ?, ?, ?, ?, ?, now())
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      statement.setLong(1, request.assignmentId());
      statement.setLong(2, request.rubricId());
      statement.setString(3, GradingJobStatus.PENDING.name());
      statement.setInt(4, request.submissionIds().size());
      statement.setInt(5, 0);
      statement.setInt(6, 0);
      statement.executeUpdate();
      try (var keys = statement.getGeneratedKeys()) {
        if (keys.next()) {
          return getJob(keys.getLong(1));
        }
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to create grading job", error);
    }
    throw new IllegalStateException("Insert did not return a generated grading job id");
  }

  @Override
  public void updateJobStatus(Long jobId, GradingJobStatus status) {
    var sql = """
        UPDATE grading_jobs
        SET status = ?,
            started_at = CASE WHEN started_at IS NULL AND ? <> 'PENDING' THEN now() ELSE started_at END,
            finished_at = CASE WHEN ? IN ('COMPLETED', 'FAILED') THEN now() ELSE finished_at END,
            updated_at = now()
        WHERE id = ?
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setString(1, status.name());
      statement.setString(2, status.name());
      statement.setString(3, status.name());
      statement.setLong(4, jobId);
      statement.executeUpdate();
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to update grading job status", error);
    }
  }

  @Override
  public void incrementJobProgress(Long jobId) {
    var sql = """
        UPDATE grading_jobs
        SET processed_submission_count = processed_submission_count + 1,
            status = CASE
              WHEN processed_submission_count + 1 >= total_submission_count THEN 'COMPLETED'
              ELSE status
            END,
            started_at = COALESCE(started_at, now()),
            finished_at = CASE
              WHEN processed_submission_count + 1 >= total_submission_count THEN now()
              ELSE finished_at
            END,
            updated_at = now()
        WHERE id = ?
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, jobId);
      statement.executeUpdate();
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to increment grading job progress", error);
    }
  }

  private GradingJobSummary getJob(Long jobId) throws SQLException {
    var sql = """
        SELECT id, assignment_id, rubric_id, total_submission_count, processed_submission_count,
               status, created_at, started_at, finished_at, updated_at
        FROM grading_jobs
        WHERE id = ?
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, jobId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return mapJob(results);
        }
      }
    }
    throw new SQLException("Grading job not found: " + jobId);
  }

  private GradingJobSummary mapJob(java.sql.ResultSet results) throws SQLException {
    var rubricId = results.getLong("rubric_id");
    var rubricIdWasNull = results.wasNull();
    return new GradingJobSummary(
        results.getLong("id"),
        results.getLong("assignment_id"),
        rubricIdWasNull ? null : rubricId,
        results.getInt("total_submission_count"),
        results.getInt("processed_submission_count"),
        GradingJobStatus.valueOf(results.getString("status")),
        86,
        results.getObject("created_at", OffsetDateTime.class),
        results.getObject("started_at", OffsetDateTime.class),
        results.getObject("finished_at", OffsetDateTime.class),
        results.getObject("updated_at", OffsetDateTime.class)
    );
  }

  private java.sql.Connection connect() throws SQLException {
    if (username == null || username.isBlank()) {
      return DriverManager.getConnection(url);
    }
    return DriverManager.getConnection(url, username, password);
  }
}
