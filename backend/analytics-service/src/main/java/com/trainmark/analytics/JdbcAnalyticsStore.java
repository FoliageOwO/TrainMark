package com.trainmark.analytics;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trainmark.shared.dto.CourseOutcomeAchievementSummary;
import com.trainmark.shared.dto.GradeStatisticsSummary;
import com.trainmark.shared.dto.LossPointSummary;
import com.trainmark.shared.dto.ScoreBucketSummary;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.analytics.store", havingValue = "jdbc")
public class JdbcAnalyticsStore implements AnalyticsStore {
  private static final TypeReference<List<ScoreBucketSummary>> SCORE_BUCKETS_TYPE = new TypeReference<>() {};

  private final String url;
  private final String username;
  private final String password;
  private final ObjectMapper objectMapper;

  public JdbcAnalyticsStore(
      @Value("${trainmark.analytics.jdbc.url:}") String url,
      @Value("${trainmark.analytics.jdbc.username:}") String username,
      @Value("${trainmark.analytics.jdbc.password:}") String password,
      ObjectMapper objectMapper
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException("trainmark.analytics.jdbc.url is required when trainmark.analytics.store=jdbc");
    }
    this.url = url;
    this.username = username;
    this.password = password;
    this.objectMapper = objectMapper;
  }

  @Override
  public GradeStatisticsSummary getGradeStatistics(Long assignmentId) {
    var sql = """
        SELECT assignment_id, submitted_count, published_count, average_score, standard_deviation,
               max_score, min_score, difficulty_index, discrimination_index, score_buckets
        FROM grade_statistics_snapshots
        WHERE assignment_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, assignmentId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return new GradeStatisticsSummary(
              results.getLong("assignment_id"),
              results.getInt("submitted_count"),
              results.getInt("published_count"),
              results.getDouble("average_score"),
              results.getDouble("standard_deviation"),
              results.getInt("max_score"),
              results.getInt("min_score"),
              results.getDouble("difficulty_index"),
              results.getDouble("discrimination_index"),
              parseScoreBuckets(results.getString("score_buckets"))
          );
        }
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to load grade statistics", error);
    }
    return new GradeStatisticsSummary(assignmentId, 0, 0, 0, 0, 0, 0, 0, 0, List.of());
  }

  @Override
  public List<LossPointSummary> listLossPoints(Long assignmentId) {
    var sql = """
        SELECT rubric_item_id, title, course_outcome_code, average_lost_score,
               affected_student_count, top_reason
        FROM loss_point_snapshots
        WHERE assignment_id = ?
        ORDER BY average_lost_score DESC, affected_student_count DESC, id
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, assignmentId);
      try (var results = statement.executeQuery()) {
        var items = new ArrayList<LossPointSummary>();
        while (results.next()) {
          var rubricItemId = results.getObject("rubric_item_id") == null ? null : results.getLong("rubric_item_id");
          items.add(new LossPointSummary(
              rubricItemId,
              results.getString("title"),
              results.getString("course_outcome_code"),
              results.getDouble("average_lost_score"),
              results.getInt("affected_student_count"),
              results.getString("top_reason")
          ));
        }
        return items;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to load loss points", error);
    }
  }

  @Override
  public List<CourseOutcomeAchievementSummary> listCourseOutcomeAchievements(Long assignmentId) {
    var sql = """
        SELECT course_outcome_code, title, target_value, achieved_value, status
        FROM course_outcome_snapshots
        WHERE assignment_id = ?
        ORDER BY course_outcome_code, id
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, assignmentId);
      try (var results = statement.executeQuery()) {
        var items = new ArrayList<CourseOutcomeAchievementSummary>();
        while (results.next()) {
          items.add(new CourseOutcomeAchievementSummary(
              results.getString("course_outcome_code"),
              results.getString("title"),
              results.getDouble("target_value"),
              results.getDouble("achieved_value"),
              results.getString("status")
          ));
        }
        return items;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to load course outcomes", error);
    }
  }

  private List<ScoreBucketSummary> parseScoreBuckets(String json) {
    if (json == null || json.isBlank()) {
      return List.of();
    }
    try {
      return objectMapper.readValue(json, SCORE_BUCKETS_TYPE);
    } catch (Exception error) {
      throw new IllegalStateException("Failed to parse score buckets", error);
    }
  }

  private java.sql.Connection connect() throws SQLException {
    if (username == null || username.isBlank()) {
      return DriverManager.getConnection(url);
    }
    return DriverManager.getConnection(url, username, password);
  }
}
