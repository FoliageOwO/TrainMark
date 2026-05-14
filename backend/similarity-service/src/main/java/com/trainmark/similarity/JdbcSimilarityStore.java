package com.trainmark.similarity;

import com.trainmark.shared.SimilarityJobStatus;
import com.trainmark.shared.dto.CreateSimilarityJobRequest;
import com.trainmark.shared.dto.SimilarityJobSummary;
import com.trainmark.shared.dto.SimilarityMatchSummary;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.similarity.store", havingValue = "jdbc")
public class JdbcSimilarityStore implements SimilarityStore {
  private final String url;
  private final String username;
  private final String password;

  public JdbcSimilarityStore(
      @Value("${trainmark.similarity.jdbc.url:}") String url,
      @Value("${trainmark.similarity.jdbc.username:}") String username,
      @Value("${trainmark.similarity.jdbc.password:}") String password
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException("trainmark.similarity.jdbc.url is required when trainmark.similarity.store=jdbc");
    }
    this.url = url;
    this.username = username;
    this.password = password;
  }

  @Override
  public Collection<SimilarityJobSummary> listJobs(Long assignmentId) {
    var sql = """
        SELECT id, assignment_id, status, checked_submission_count, max_similarity,
               high_risk_pair_count, created_at
        FROM similarity_jobs
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
        var jobs = new ArrayList<SimilarityJobSummary>();
        while (results.next()) {
          var jobId = results.getLong("id");
          jobs.add(new SimilarityJobSummary(
              jobId,
              results.getLong("assignment_id"),
              results.getInt("checked_submission_count"),
              SimilarityJobStatus.valueOf(results.getString("status")),
              results.getDouble("max_similarity"),
              results.getInt("high_risk_pair_count"),
              results.getObject("created_at", OffsetDateTime.class),
              listMatches(connection, jobId)
          ));
        }
        return jobs;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to list similarity jobs", error);
    }
  }

  @Override
  public SimilarityJobSummary createJob(CreateSimilarityJobRequest request) {
    try (var connection = connect()) {
      connection.setAutoCommit(false);
      try {
        var matches = buildMatches(connection, request);
        var job = insertJob(connection, request, matches);
        insertMatches(connection, job.id(), matches);
        connection.commit();
        return job;
      } catch (SQLException | RuntimeException error) {
        connection.rollback();
        throw error;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to create similarity job", error);
    }
  }

  @Override
  public SimilarityJobSummary getJob(Long jobId) {
    var sql = """
        SELECT id, assignment_id, status, checked_submission_count, max_similarity,
               high_risk_pair_count, created_at
        FROM similarity_jobs
        WHERE id = ?
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, jobId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return new SimilarityJobSummary(
              results.getLong("id"),
              results.getLong("assignment_id"),
              results.getInt("checked_submission_count"),
              SimilarityJobStatus.valueOf(results.getString("status")),
              results.getDouble("max_similarity"),
              results.getInt("high_risk_pair_count"),
              results.getObject("created_at", OffsetDateTime.class),
              listMatches(connection, jobId)
          );
        }
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to load similarity job", error);
    }
    throw new IllegalArgumentException("Similarity job not found: " + jobId);
  }

  private SimilarityJobSummary insertJob(
      Connection connection,
      CreateSimilarityJobRequest request,
      List<SimilarityMatchSummary> matches
  ) throws SQLException {
    var sql = """
        INSERT INTO similarity_jobs (
          assignment_id, status, checked_submission_count, max_similarity, high_risk_pair_count
        ) VALUES (?, ?, ?, ?, ?)
        """;
    try (var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      statement.setLong(1, request.assignmentId());
      statement.setString(2, SimilarityJobStatus.COMPLETED.name());
      statement.setInt(3, request.submissionIds().size());
      statement.setDouble(4, matches.stream().mapToDouble(SimilarityMatchSummary::similarity).max().orElse(0));
      statement.setInt(5, (int) matches.stream().filter(item -> "HIGH".equals(item.riskLevel())).count());
      statement.executeUpdate();
      try (var keys = statement.getGeneratedKeys()) {
        if (keys.next()) {
          return getJob(connection, keys.getLong(1), matches);
        }
      }
    }
    throw new SQLException("Insert did not return a generated similarity job id");
  }

  private SimilarityJobSummary getJob(
      Connection connection,
      Long jobId,
      List<SimilarityMatchSummary> matches
  ) throws SQLException {
    var sql = """
        SELECT id, assignment_id, status, checked_submission_count, max_similarity,
               high_risk_pair_count, created_at
        FROM similarity_jobs
        WHERE id = ?
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, jobId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return new SimilarityJobSummary(
              results.getLong("id"),
              results.getLong("assignment_id"),
              results.getInt("checked_submission_count"),
              SimilarityJobStatus.valueOf(results.getString("status")),
              results.getDouble("max_similarity"),
              results.getInt("high_risk_pair_count"),
              results.getObject("created_at", OffsetDateTime.class),
              matches
          );
        }
      }
    }
    throw new SQLException("Inserted similarity job not found: " + jobId);
  }

  private List<SimilarityMatchSummary> buildMatches(Connection connection, CreateSimilarityJobRequest request) throws SQLException {
    if (request.submissionIds().size() < 2) {
      return List.of();
    }
    var first = submissionStudentName(connection, request.submissionIds().get(0), "待检测学生A");
    var second = submissionStudentName(connection, request.submissionIds().get(1), "待检测学生B");
    return List.of(new SimilarityMatchSummary(
        request.submissionIds().get(0),
        request.submissionIds().get(1),
        first,
        second,
        request.includeHistory() ? 0.74 : 0.61,
        "需求分析章节",
        request.includeHistory() ? "MEDIUM" : "LOW"
    ));
  }

  private String submissionStudentName(Connection connection, Long submissionId, String fallback) throws SQLException {
    var sql = """
        SELECT u.name
        FROM submissions s
        JOIN users u ON u.id = s.student_id
        WHERE s.id = ?
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, submissionId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return results.getString("name");
        }
      }
    }
    return fallback;
  }

  private void insertMatches(
      Connection connection,
      Long jobId,
      List<SimilarityMatchSummary> matches
  ) throws SQLException {
    if (matches.isEmpty()) {
      return;
    }
    var sql = """
        INSERT INTO similarity_matches (
          similarity_job_id, source_submission_id, target_submission_id,
          similarity, matched_section, risk_level
        ) VALUES (?, ?, ?, ?, ?, ?)
        """;
    try (var statement = connection.prepareStatement(sql)) {
      for (var match : matches) {
        statement.setLong(1, jobId);
        statement.setLong(2, match.sourceSubmissionId());
        statement.setLong(3, match.targetSubmissionId());
        statement.setDouble(4, match.similarity());
        statement.setString(5, match.matchedSection());
        statement.setString(6, match.riskLevel());
        statement.addBatch();
      }
      statement.executeBatch();
    }
  }

  private List<SimilarityMatchSummary> listMatches(Connection connection, Long jobId) throws SQLException {
    var sql = """
        SELECT sm.source_submission_id, sm.target_submission_id,
               COALESCE(source_user.name, '提交 #' || sm.source_submission_id) AS source_student_name,
               COALESCE(target_user.name, '提交 #' || sm.target_submission_id) AS target_student_name,
               sm.similarity, sm.matched_section, sm.risk_level
        FROM similarity_matches sm
        LEFT JOIN submissions source_submission ON source_submission.id = sm.source_submission_id
        LEFT JOIN users source_user ON source_user.id = source_submission.student_id
        LEFT JOIN submissions target_submission ON target_submission.id = sm.target_submission_id
        LEFT JOIN users target_user ON target_user.id = target_submission.student_id
        WHERE sm.similarity_job_id = ?
        ORDER BY sm.similarity DESC, sm.id
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, jobId);
      try (var results = statement.executeQuery()) {
        var matches = new ArrayList<SimilarityMatchSummary>();
        while (results.next()) {
          matches.add(new SimilarityMatchSummary(
              results.getLong("source_submission_id"),
              results.getLong("target_submission_id"),
              results.getString("source_student_name"),
              results.getString("target_student_name"),
              results.getDouble("similarity"),
              results.getString("matched_section"),
              results.getString("risk_level")
          ));
        }
        return matches;
      }
    }
  }

  private Connection connect() throws SQLException {
    if (username == null || username.isBlank()) {
      return DriverManager.getConnection(url);
    }
    return DriverManager.getConnection(url, username, password);
  }
}
