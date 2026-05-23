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
    // Fallback: compute from live grading_results
    return computeGradeStatistics(assignmentId);
  }

  public GradeStatisticsSummary computeGradeStatistics(Long assignmentId) {
    var sql = """
        SELECT
          COUNT(*) AS submitted_count,
          COUNT(*) FILTER (WHERE publication_status = 'PUBLISHED') AS published_count,
          COALESCE(AVG(teacher_score), 0) AS average_score,
          COALESCE(STDDEV(teacher_score), 0) AS standard_deviation,
          COALESCE(MAX(teacher_score), 0) AS max_score,
          COALESCE(MIN(teacher_score), 0) AS min_score,
          COALESCE(AVG(teacher_score)::double precision / NULLIF(MAX(total_score), 0), 0) AS difficulty_index
        FROM grading_results
        WHERE assignment_id = ?
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, assignmentId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          var submitted = results.getInt("submitted_count");
          var published = results.getInt("published_count");
          var avg = results.getDouble("average_score");
          var stddev = results.getDouble("standard_deviation");
          var max = results.getInt("max_score");
          var min = results.getInt("min_score");
          var difficulty = results.getDouble("difficulty_index");

          // Compute score buckets
          var buckets = computeScoreBuckets(connection, assignmentId);
          // Compute discrimination index (simplified: correlation between high/low groups)
          var discrimination = computeDiscriminationIndex(connection, assignmentId);

          return new GradeStatisticsSummary(
              assignmentId, submitted, published,
              Math.round(avg * 10.0) / 10.0,
              Math.round(stddev * 10.0) / 10.0,
              max, min,
              Math.round(difficulty * 100.0) / 100.0,
              discrimination,
              buckets
          );
        }
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to compute grade statistics", error);
    }
    return new GradeStatisticsSummary(assignmentId, 0, 0, 0, 0, 0, 0, 0, 0, List.of());
  }

  private List<ScoreBucketSummary> computeScoreBuckets(java.sql.Connection connection, Long assignmentId)
      throws SQLException {
    var sql = """
        SELECT
          COUNT(*) FILTER (WHERE teacher_score >= 90) AS bucket_90,
          COUNT(*) FILTER (WHERE teacher_score >= 80 AND teacher_score < 90) AS bucket_80,
          COUNT(*) FILTER (WHERE teacher_score >= 70 AND teacher_score < 80) AS bucket_70,
          COUNT(*) FILTER (WHERE teacher_score >= 60 AND teacher_score < 70) AS bucket_60,
          COUNT(*) FILTER (WHERE teacher_score < 60) AS bucket_below_60
        FROM grading_results
        WHERE assignment_id = ?
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, assignmentId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return List.of(
              new ScoreBucketSummary("90-100", 90, 100, results.getInt("bucket_90")),
              new ScoreBucketSummary("80-89", 80, 89, results.getInt("bucket_80")),
              new ScoreBucketSummary("70-79", 70, 79, results.getInt("bucket_70")),
              new ScoreBucketSummary("60-69", 60, 69, results.getInt("bucket_60")),
              new ScoreBucketSummary("<60", 0, 59, results.getInt("bucket_below_60"))
          );
        }
      }
    }
    return List.of();
  }

  private double computeDiscriminationIndex(java.sql.Connection connection, Long assignmentId)
      throws SQLException {
    // Simplified: difference between top 27% and bottom 27% average scores
    var sql = """
        WITH ranked AS (
          SELECT teacher_score,
                 NTILE(100) OVER (ORDER BY teacher_score) AS percentile
          FROM grading_results
          WHERE assignment_id = ? AND teacher_score IS NOT NULL
        )
        SELECT
          AVG(teacher_score) FILTER (WHERE percentile <= 27) AS low_avg,
          AVG(teacher_score) FILTER (WHERE percentile > 73) AS high_avg,
          MAX(teacher_score) - MIN(teacher_score) AS score_range
        FROM ranked
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, assignmentId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          var lowAvg = results.getDouble("low_avg");
          var highAvg = results.getDouble("high_avg");
          var range = results.getDouble("score_range");
          if (range > 0 && !results.wasNull()) {
            return Math.round((highAvg - lowAvg) / range * 100.0) / 100.0;
          }
        }
      }
    }
    return 0;
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
        if (!items.isEmpty()) {
          return items;
        }
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to load loss points", error);
    }
    // Fallback: compute from live grading_result_items
    return computeLossPoints(assignmentId);
  }

  public List<LossPointSummary> computeLossPoints(Long assignmentId) {
    var sql = """
        SELECT
          gri.rubric_item_id,
          gri.title,
          ri.course_outcome_code,
          AVG(gri.max_score - gri.teacher_score) AS average_lost_score,
          COUNT(*) FILTER (WHERE gri.teacher_score < gri.max_score) AS affected_count,
          COUNT(*) AS total_count
        FROM grading_result_items gri
        JOIN grading_results gr ON gr.id = gri.result_id
        LEFT JOIN rubric_items ri ON ri.id = gri.rubric_item_id
        WHERE gr.assignment_id = ?
        GROUP BY gri.rubric_item_id, gri.title, ri.course_outcome_code
        ORDER BY average_lost_score DESC
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, assignmentId);
      try (var results = statement.executeQuery()) {
        var items = new ArrayList<LossPointSummary>();
        while (results.next()) {
          var avgLost = results.getDouble("average_lost_score");
          var affected = results.getInt("affected_count");
          var title = results.getString("title");
          items.add(new LossPointSummary(
              results.getObject("rubric_item_id") != null ? results.getLong("rubric_item_id") : null,
              title,
              results.getString("course_outcome_code"),
              Math.round(avgLost * 10.0) / 10.0,
              affected,
              generateLossReason(title, avgLost)
          ));
        }
        return items;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to compute loss points", error);
    }
  }

  private String generateLossReason(String title, double avgLost) {
    if (avgLost > 6) {
      return title + " 失分严重，建议加强相关知识点的教学";
    }
    if (avgLost > 3) {
      return title + " 存在部分不足，需关注常见错误";
    }
    return title + " 整体掌握较好";
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
        if (!items.isEmpty()) {
          return items;
        }
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to load course outcomes", error);
    }
    // Fallback: compute from live grading_result_items
    return computeCourseOutcomes(assignmentId);
  }

  public List<CourseOutcomeAchievementSummary> computeCourseOutcomes(Long assignmentId) {
    var sql = """
        SELECT
          ri.course_outcome_code,
          COALESCE(ri.title, gri.title) AS title,
          AVG(gri.teacher_score) AS avg_score,
          AVG(gri.max_score) AS avg_max
        FROM grading_result_items gri
        JOIN grading_results gr ON gr.id = gri.result_id
        LEFT JOIN rubric_items ri ON ri.id = gri.rubric_item_id
        WHERE gr.assignment_id = ?
          AND ri.course_outcome_code IS NOT NULL
        GROUP BY ri.course_outcome_code, COALESCE(ri.title, gri.title)
        ORDER BY ri.course_outcome_code
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, assignmentId);
      try (var results = statement.executeQuery()) {
        var items = new ArrayList<CourseOutcomeAchievementSummary>();
        while (results.next()) {
          var avgScore = results.getDouble("avg_score");
          var avgMax = results.getDouble("avg_max");
          var achieved = avgMax > 0 ? avgScore / avgMax : 0;
          var target = 0.75;
          items.add(new CourseOutcomeAchievementSummary(
              results.getString("course_outcome_code"),
              results.getString("title"),
              target,
              Math.round(achieved * 100.0) / 100.0,
              achieved >= target ? "达成" : "未达成"
          ));
        }
        return items;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to compute course outcomes", error);
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
