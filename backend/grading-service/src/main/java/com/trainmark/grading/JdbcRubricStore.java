package com.trainmark.grading;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trainmark.shared.dto.CreateRubricRequest;
import com.trainmark.shared.dto.RubricItemSummary;
import com.trainmark.shared.dto.RubricPointSummary;
import com.trainmark.shared.dto.RubricSummary;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.grading.rubric-store", havingValue = "jdbc")
public class JdbcRubricStore implements RubricStore {
  private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {};

  private final String url;
  private final String username;
  private final String password;
  private final ObjectMapper objectMapper;

  public JdbcRubricStore(
      @Value("${trainmark.grading.jdbc.url:}") String url,
      @Value("${trainmark.grading.jdbc.username:}") String username,
      @Value("${trainmark.grading.jdbc.password:}") String password,
      ObjectMapper objectMapper
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException("trainmark.grading.jdbc.url is required when trainmark.grading.rubric-store=jdbc");
    }
    this.url = url;
    this.username = username;
    this.password = password;
    this.objectMapper = objectMapper;
  }

  @Override
  public Collection<RubricSummary> listRubrics(Long assignmentId) {
    var sql = """
        SELECT id, assignment_id, name, total_score
        FROM rubrics
        """;
    if (assignmentId != null) {
      sql += "WHERE assignment_id = ?\n";
    }
    sql += "ORDER BY id DESC";

    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      if (assignmentId != null) {
        statement.setLong(1, assignmentId);
      }
      try (var results = statement.executeQuery()) {
        var rubrics = new ArrayList<RubricSummary>();
        while (results.next()) {
          var rubricId = results.getLong("id");
          rubrics.add(new RubricSummary(
              rubricId,
              results.getLong("assignment_id"),
              results.getString("name"),
              results.getInt("total_score"),
              listItems(connection, rubricId)
          ));
        }
        return rubrics;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to list rubrics", error);
    }
  }

  @Override
  public RubricSummary createRubric(CreateRubricRequest request) {
    try (var connection = connect()) {
      connection.setAutoCommit(false);
      try {
        var rubricId = insertRubric(connection, request);
        insertItems(connection, rubricId, request);
        var rubric = getRubric(connection, rubricId);
        connection.commit();
        return rubric;
      } catch (SQLException | RuntimeException error) {
        connection.rollback();
        throw error;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to create rubric", error);
    }
  }

  @Override
  public Optional<RubricSummary> findFirstForAssignment(Long assignmentId) {
    return listRubrics(assignmentId).stream().findFirst()
        .or(() -> listRubrics(null).stream().findFirst());
  }

  private Long insertRubric(Connection connection, CreateRubricRequest request) throws SQLException {
    var sql = "INSERT INTO rubrics (assignment_id, name, total_score) VALUES (?, ?, ?)";
    try (var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      statement.setLong(1, request.assignmentId());
      statement.setString(2, request.name());
      statement.setInt(3, request.totalScore());
      statement.executeUpdate();
      try (var keys = statement.getGeneratedKeys()) {
        if (keys.next()) {
          return keys.getLong(1);
        }
      }
    }
    throw new SQLException("Insert did not return a generated rubric id");
  }

  private void insertItems(Connection connection, Long rubricId, CreateRubricRequest request) throws SQLException {
    if (request.items() == null || request.items().isEmpty()) {
      return;
    }
    var sql = """
        INSERT INTO rubric_items (rubric_id, title, score, course_outcome_code, sort_order)
        VALUES (?, ?, ?, ?, ?)
        """;
    try (var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      var sortOrder = 0;
      for (var item : request.items()) {
        statement.setLong(1, rubricId);
        statement.setString(2, item.title());
        statement.setInt(3, item.score());
        statement.setString(4, item.courseOutcomeCode());
        statement.setInt(5, sortOrder++);
        statement.executeUpdate();
        try (var keys = statement.getGeneratedKeys()) {
          if (keys.next()) {
            insertPoints(connection, keys.getLong(1), item.points());
          }
        }
      }
    }
  }

  private void insertPoints(Connection connection, Long rubricItemId, List<com.trainmark.shared.dto.RubricPointRequest> points)
      throws SQLException {
    if (points == null || points.isEmpty()) {
      return;
    }
    var sql = """
        INSERT INTO rubric_points (
          rubric_item_id, title, description, score, keywords, synonyms, sort_order
        ) VALUES (?, ?, ?, ?, ?::jsonb, ?::jsonb, ?)
        """;
    try (var statement = connection.prepareStatement(sql)) {
      var sortOrder = 0;
      for (var point : points) {
        statement.setLong(1, rubricItemId);
        statement.setString(2, point.title());
        statement.setString(3, point.description() == null ? "" : point.description());
        statement.setInt(4, point.score());
        statement.setString(5, toJson(point.keywords()));
        statement.setString(6, toJson(point.synonyms()));
        statement.setInt(7, sortOrder++);
        statement.addBatch();
      }
      statement.executeBatch();
    }
  }

  private RubricSummary getRubric(Connection connection, Long rubricId) throws SQLException {
    var sql = "SELECT id, assignment_id, name, total_score FROM rubrics WHERE id = ?";
    try (var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, rubricId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return new RubricSummary(
              results.getLong("id"),
              results.getLong("assignment_id"),
              results.getString("name"),
              results.getInt("total_score"),
              listItems(connection, rubricId)
          );
        }
      }
    }
    throw new SQLException("Rubric not found: " + rubricId);
  }

  private List<RubricItemSummary> listItems(Connection connection, Long rubricId) throws SQLException {
    var sql = """
        SELECT id, title, score, course_outcome_code
        FROM rubric_items
        WHERE rubric_id = ?
        ORDER BY sort_order, id
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, rubricId);
      try (var results = statement.executeQuery()) {
        var items = new ArrayList<RubricItemSummary>();
        while (results.next()) {
          var itemId = results.getLong("id");
          items.add(new RubricItemSummary(
              itemId,
              results.getString("title"),
              results.getInt("score"),
              results.getString("course_outcome_code"),
              listPoints(connection, itemId)
          ));
        }
        return items;
      }
    }
  }

  private List<RubricPointSummary> listPoints(Connection connection, Long rubricItemId) throws SQLException {
    var sql = """
        SELECT id, title, description, score, keywords, synonyms
        FROM rubric_points
        WHERE rubric_item_id = ?
        ORDER BY sort_order, id
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, rubricItemId);
      try (var results = statement.executeQuery()) {
        var points = new ArrayList<RubricPointSummary>();
        while (results.next()) {
          points.add(new RubricPointSummary(
              results.getLong("id"),
              results.getString("title"),
              results.getString("description"),
              results.getInt("score"),
              fromJson(results.getString("keywords")),
              fromJson(results.getString("synonyms"))
          ));
        }
        return points;
      }
    }
  }

  private String toJson(List<String> values) {
    try {
      return objectMapper.writeValueAsString(values == null ? List.of() : values);
    } catch (Exception error) {
      throw new IllegalStateException("Failed to serialize rubric point tokens", error);
    }
  }

  private List<String> fromJson(String json) {
    if (json == null || json.isBlank()) {
      return List.of();
    }
    try {
      return objectMapper.readValue(json, STRING_LIST_TYPE);
    } catch (Exception error) {
      throw new IllegalStateException("Failed to parse rubric point tokens", error);
    }
  }

  private Connection connect() throws SQLException {
    if (username == null || username.isBlank()) {
      return DriverManager.getConnection(url);
    }
    return DriverManager.getConnection(url, username, password);
  }
}
