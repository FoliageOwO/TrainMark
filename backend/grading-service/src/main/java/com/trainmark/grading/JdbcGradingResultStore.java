package com.trainmark.grading;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trainmark.shared.PublicationStatus;
import com.trainmark.shared.ReviewStatus;
import com.trainmark.shared.dto.GradingAnnotationSummary;
import com.trainmark.shared.dto.GradingItemReview;
import com.trainmark.shared.dto.GradingResultSummary;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.grading.result-store", havingValue = "jdbc")
public class JdbcGradingResultStore implements GradingResultStore {
  private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {};

  private final String url;
  private final String username;
  private final String password;
  private final ObjectMapper objectMapper;

  public JdbcGradingResultStore(
      @Value("${trainmark.grading.jdbc.url:}") String url,
      @Value("${trainmark.grading.jdbc.username:}") String username,
      @Value("${trainmark.grading.jdbc.password:}") String password,
      ObjectMapper objectMapper
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException("trainmark.grading.jdbc.url is required when trainmark.grading.result-store=jdbc");
    }
    this.url = url;
    this.username = username;
    this.password = password;
    this.objectMapper = objectMapper;
  }

  @Override
  public Collection<GradingResultSummary> listResults(Long assignmentId, ReviewStatus reviewStatus) {
    var sql = new StringBuilder(resultSelectSql()).append("WHERE 1 = 1\n");
    var parameterIndex = 1;
    if (assignmentId != null) {
      sql.append("AND r.assignment_id = ?\n");
    }
    if (reviewStatus != null) {
      sql.append("AND r.review_status = ?\n");
    }
    sql.append("ORDER BY r.created_at DESC, r.id DESC");

    try (var connection = connect();
        var statement = connection.prepareStatement(sql.toString())) {
      if (assignmentId != null) {
        statement.setLong(parameterIndex++, assignmentId);
      }
      if (reviewStatus != null) {
        statement.setString(parameterIndex, reviewStatus.name());
      }
      try (var results = statement.executeQuery()) {
        var summaries = new ArrayList<GradingResultSummary>();
        while (results.next()) {
          summaries.add(mapResult(connection, results));
        }
        return summaries;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to list grading results", error);
    }
  }

  @Override
  public Optional<GradingResultSummary> findResult(Long resultId) {
    var sql = resultSelectSql() + "WHERE r.id = ?";
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, resultId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return Optional.of(mapResult(connection, results));
        }
      }
      return Optional.empty();
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to find grading result", error);
    }
  }

  @Override
  public boolean hasSubmissionResult(Long submissionId) {
    var sql = "SELECT 1 FROM grading_results WHERE submission_id = ? LIMIT 1";
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, submissionId);
      try (var results = statement.executeQuery()) {
        return results.next();
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to check grading result existence", error);
    }
  }

  @Override
  public long nextResultId() {
    var sql = "SELECT nextval('grading_results_id_seq')";
    try (var connection = connect();
        var statement = connection.prepareStatement(sql);
        var results = statement.executeQuery()) {
      if (results.next()) {
        return results.getLong(1);
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to allocate grading result id", error);
    }
    throw new IllegalStateException("No grading result id returned");
  }

  @Override
  public GradingResultSummary saveScoredResult(GradingResultSummary result) {
    var sql = """
        INSERT INTO grading_results (
          id, assignment_id, submission_id, student_id, annotation_pdf_url,
          total_score, ai_score, teacher_score, confidence,
          review_status, publication_status, overall_comment, reviewed_at, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
    try (var connection = connect()) {
      connection.setAutoCommit(false);
      try (var statement = connection.prepareStatement(sql)) {
        statement.setLong(1, result.id());
        statement.setLong(2, result.assignmentId());
        statement.setLong(3, result.submissionId());
        statement.setLong(4, result.studentId());
        statement.setString(5, result.annotationPdfUrl());
        statement.setInt(6, result.totalScore());
        statement.setInt(7, result.aiScore());
        statement.setInt(8, result.teacherScore());
        statement.setInt(9, result.confidence());
        statement.setString(10, result.reviewStatus().name());
        statement.setString(11, result.publicationStatus().name());
        statement.setString(12, result.overallComment());
        statement.setObject(13, result.reviewedAt());
        statement.setObject(14, result.publishedAt());
        statement.executeUpdate();
      }
      replaceItems(connection, result);
      replaceAnnotations(connection, result);
      connection.commit();
      return findResult(result.id()).orElseThrow();
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to save scored grading result", error);
    }
  }

  @Override
  public GradingResultSummary saveReviewedResult(GradingResultSummary result) {
    var sql = """
        UPDATE grading_results
        SET teacher_score = ?, review_status = ?, overall_comment = ?, reviewed_at = ?, updated_at = now()
        WHERE id = ?
        """;
    try (var connection = connect()) {
      connection.setAutoCommit(false);
      try (var statement = connection.prepareStatement(sql)) {
        statement.setInt(1, result.teacherScore());
        statement.setString(2, result.reviewStatus().name());
        statement.setString(3, result.overallComment());
        statement.setObject(4, result.reviewedAt());
        statement.setLong(5, result.id());
        if (statement.executeUpdate() == 0) {
          throw new IllegalArgumentException("Grading result not found: " + result.id());
        }
      }
      replaceItems(connection, result);
      connection.commit();
      return findResult(result.id()).orElseThrow();
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to save reviewed grading result", error);
    }
  }

  @Override
  public GradingResultSummary savePublicationStatus(
      GradingResultSummary result,
      PublicationStatus publicationStatus,
      OffsetDateTime publishedAt
  ) {
    var sql = """
        UPDATE grading_results
        SET publication_status = ?, published_at = ?, updated_at = now()
        WHERE id = ?
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setString(1, publicationStatus.name());
      statement.setObject(2, publishedAt);
      statement.setLong(3, result.id());
      if (statement.executeUpdate() == 0) {
        throw new IllegalArgumentException("Grading result not found: " + result.id());
      }
      return findResult(result.id()).orElseThrow();
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to save grading publication status", error);
    }
  }

  private String resultSelectSql() {
    return """
        SELECT r.id, r.assignment_id, r.submission_id, r.student_id,
               u.name AS student_name, u.student_no,
               COALESCE(sf.file_name, '自动批改报告-' || r.submission_id || '.pdf') AS file_name,
               COALESCE(sf.preview_url, '/previews/submissions/' || r.submission_id || '/report.pdf') AS preview_url,
               r.annotation_pdf_url, r.total_score, r.ai_score, r.teacher_score, r.confidence,
               r.review_status, r.publication_status, r.overall_comment, r.reviewed_at, r.published_at
        FROM grading_results r
        JOIN users u ON u.id = r.student_id
        LEFT JOIN LATERAL (
          SELECT file_name, preview_url
          FROM submission_files
          WHERE submission_id = r.submission_id
          ORDER BY uploaded_at DESC, id DESC
          LIMIT 1
        ) sf ON true
        """;
  }

  private GradingResultSummary mapResult(
      java.sql.Connection connection,
      java.sql.ResultSet results
  ) throws SQLException {
    var resultId = results.getLong("id");
    return new GradingResultSummary(
        resultId,
        results.getLong("assignment_id"),
        results.getLong("submission_id"),
        results.getLong("student_id"),
        results.getString("student_name"),
        results.getString("student_no"),
        results.getString("file_name"),
        results.getString("preview_url"),
        results.getString("annotation_pdf_url"),
        results.getInt("total_score"),
        results.getInt("ai_score"),
        results.getInt("teacher_score"),
        results.getInt("confidence"),
        ReviewStatus.valueOf(results.getString("review_status")),
        PublicationStatus.valueOf(results.getString("publication_status")),
        results.getString("overall_comment"),
        results.getObject("reviewed_at", OffsetDateTime.class),
        results.getObject("published_at", OffsetDateTime.class),
        listItems(connection, resultId),
        listAnnotations(connection, resultId)
    );
  }

  private List<GradingItemReview> listItems(java.sql.Connection connection, Long resultId) throws SQLException {
    var sql = """
        SELECT rubric_item_id, title, max_score, ai_score, teacher_score,
               deduction_reason, teacher_comment, confidence, evidence::text AS evidence
        FROM grading_result_items
        WHERE result_id = ?
        ORDER BY id ASC
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, resultId);
      try (var results = statement.executeQuery()) {
        var items = new ArrayList<GradingItemReview>();
        while (results.next()) {
          items.add(new GradingItemReview(
              results.getLong("rubric_item_id"),
              results.getString("title"),
              results.getInt("max_score"),
              results.getInt("ai_score"),
              results.getInt("teacher_score"),
              results.getString("deduction_reason"),
              results.getString("teacher_comment"),
              results.getInt("confidence"),
              readEvidence(results.getString("evidence"))
          ));
        }
        return items;
      }
    }
  }

  private List<GradingAnnotationSummary> listAnnotations(
      java.sql.Connection connection,
      Long resultId
  ) throws SQLException {
    var sql = """
        SELECT id, page, anchor_text, comment, severity
        FROM grading_annotations
        WHERE result_id = ?
        ORDER BY page ASC, id ASC
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, resultId);
      try (var results = statement.executeQuery()) {
        var annotations = new ArrayList<GradingAnnotationSummary>();
        while (results.next()) {
          annotations.add(new GradingAnnotationSummary(
              results.getLong("id"),
              results.getInt("page"),
              results.getString("anchor_text"),
              results.getString("comment"),
              results.getString("severity")
          ));
        }
        return annotations;
      }
    }
  }

  private void replaceItems(java.sql.Connection connection, GradingResultSummary result) throws SQLException {
    try (var delete = connection.prepareStatement("DELETE FROM grading_result_items WHERE result_id = ?")) {
      delete.setLong(1, result.id());
      delete.executeUpdate();
    }
    var sql = """
        INSERT INTO grading_result_items (
          result_id, rubric_item_id, title, max_score, ai_score, teacher_score,
          deduction_reason, teacher_comment, confidence, evidence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb)
        """;
    try (var statement = connection.prepareStatement(sql)) {
      for (var item : result.items()) {
        statement.setLong(1, result.id());
        statement.setLong(2, item.rubricItemId());
        statement.setString(3, item.title());
        statement.setInt(4, item.maxScore());
        statement.setInt(5, item.aiScore());
        statement.setInt(6, item.teacherScore());
        statement.setString(7, item.deductionReason());
        statement.setString(8, item.teacherComment());
        statement.setInt(9, item.confidence());
        statement.setString(10, writeEvidence(item.evidence()));
        statement.addBatch();
      }
      statement.executeBatch();
    }
  }

  private void replaceAnnotations(java.sql.Connection connection, GradingResultSummary result) throws SQLException {
    try (var delete = connection.prepareStatement("DELETE FROM grading_annotations WHERE result_id = ?")) {
      delete.setLong(1, result.id());
      delete.executeUpdate();
    }
    var sql = """
        INSERT INTO grading_annotations (result_id, page, anchor_text, comment, severity)
        VALUES (?, ?, ?, ?, ?)
        """;
    try (var statement = connection.prepareStatement(sql)) {
      for (var annotation : result.annotations()) {
        statement.setLong(1, result.id());
        statement.setInt(2, annotation.page());
        statement.setString(3, annotation.anchorText());
        statement.setString(4, annotation.comment());
        statement.setString(5, annotation.severity());
        statement.addBatch();
      }
      statement.executeBatch();
    }
  }

  private List<String> readEvidence(String evidenceJson) {
    if (evidenceJson == null || evidenceJson.isBlank()) {
      return List.of();
    }
    try {
      return objectMapper.readValue(evidenceJson, STRING_LIST_TYPE);
    } catch (JsonProcessingException error) {
      throw new IllegalStateException("Failed to parse grading item evidence", error);
    }
  }

  private String writeEvidence(List<String> evidence) {
    try {
      return objectMapper.writeValueAsString(evidence == null ? List.of() : evidence);
    } catch (JsonProcessingException error) {
      throw new IllegalStateException("Failed to write grading item evidence", error);
    }
  }

  private java.sql.Connection connect() throws SQLException {
    if (username == null || username.isBlank()) {
      return DriverManager.getConnection(url);
    }
    return DriverManager.getConnection(url, username, password);
  }
}
