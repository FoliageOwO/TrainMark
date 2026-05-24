package com.trainmark.course;

import com.trainmark.shared.AssignmentStatus;
import com.trainmark.shared.CourseStatus;
import com.trainmark.shared.dto.AssignmentSummary;
import com.trainmark.shared.dto.CourseSummary;
import com.trainmark.shared.dto.CreateAssignmentRequest;
import com.trainmark.shared.dto.CreateCourseRequest;
import com.trainmark.shared.dto.CreateTeachingClassRequest;
import com.trainmark.shared.dto.TeachingClassSummary;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.course.store", havingValue = "jdbc")
public class JdbcCourseStore implements CourseStore {
  private final String url;
  private final String username;
  private final String password;

  public JdbcCourseStore(
      @Value("${trainmark.course.jdbc.url:}") String url,
      @Value("${trainmark.course.jdbc.username:}") String username,
      @Value("${trainmark.course.jdbc.password:}") String password
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException("trainmark.course.jdbc.url is required when trainmark.course.store=jdbc");
    }
    this.url = url;
    this.username = username;
    this.password = password;
  }

  @Override
  public Collection<CourseSummary> listCourses() {
    var sql = """
        SELECT c.id, c.name, c.code, c.semester, c.status,
               (SELECT count(*) FROM teaching_classes tc WHERE tc.course_id = c.id) AS class_count,
               (
                 SELECT count(*)
                 FROM class_students cs
                 JOIN teaching_classes tc ON tc.id = cs.class_id
                 WHERE tc.course_id = c.id
               ) AS student_count
        FROM courses c
        ORDER BY c.id
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql);
        var results = statement.executeQuery()) {
      var courses = new ArrayList<CourseSummary>();
      while (results.next()) {
        courses.add(new CourseSummary(
            results.getLong("id"),
            results.getString("name"),
            results.getString("code"),
            results.getString("semester"),
            CourseStatus.valueOf(results.getString("status")),
            results.getInt("class_count"),
            results.getInt("student_count")
        ));
      }
      return courses;
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to list courses", error);
    }
  }

  @Override
  public CourseSummary createCourse(CreateCourseRequest request) {
    var sql = "INSERT INTO courses (name, code, semester, description, status) VALUES (?, ?, ?, ?, ?)";
    try (var connection = connect();
        var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      statement.setString(1, request.name());
      statement.setString(2, request.code());
      statement.setString(3, request.semester());
      statement.setString(4, request.description());
      statement.setString(5, CourseStatus.ACTIVE.name());
      statement.executeUpdate();
      return new CourseSummary(generatedId(statement), request.name(), request.code(), request.semester(), CourseStatus.ACTIVE, 0, 0);
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to create course", error);
    }
  }

  @Override
  public Collection<TeachingClassSummary> listClasses(Long courseId) {
    var sql = """
        SELECT tc.id, tc.course_id, tc.name, tc.major, tc.grade, count(cs.student_id) AS student_count
        FROM teaching_classes tc
        LEFT JOIN class_students cs ON cs.class_id = tc.id
        WHERE tc.course_id = ?
        GROUP BY tc.id, tc.course_id, tc.name, tc.major, tc.grade
        ORDER BY tc.id
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, courseId);
      try (var results = statement.executeQuery()) {
        var classes = new ArrayList<TeachingClassSummary>();
        while (results.next()) {
          classes.add(new TeachingClassSummary(
              results.getLong("id"),
              results.getLong("course_id"),
              results.getString("name"),
              results.getString("major"),
              results.getString("grade"),
              results.getInt("student_count")
          ));
        }
        return classes;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to list teaching classes", error);
    }
  }

  @Override
  public TeachingClassSummary createClass(Long courseId, CreateTeachingClassRequest request) {
    var sql = "INSERT INTO teaching_classes (course_id, name, major, grade) VALUES (?, ?, ?, ?)";
    try (var connection = connect();
        var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      statement.setLong(1, courseId);
      statement.setString(2, request.name());
      statement.setString(3, request.major());
      statement.setString(4, request.grade());
      statement.executeUpdate();
      return new TeachingClassSummary(generatedId(statement), courseId, request.name(), request.major(), request.grade(), 0);
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to create teaching class", error);
    }
  }

  @Override
  public Collection<AssignmentSummary> listAssignments(Long courseId) {
    var sql = """
        SELECT id, course_id, title, deadline, total_score, status, similarity_check_enabled, ai_grading_enabled
        FROM assignments
        """;
    if (courseId != null) {
      sql += "WHERE course_id = ?\n";
    }
    sql += "ORDER BY id";

    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      if (courseId != null) {
        statement.setLong(1, courseId);
      }
      try (var results = statement.executeQuery()) {
        var assignments = new ArrayList<AssignmentSummary>();
        while (results.next()) {
          assignments.add(new AssignmentSummary(
              results.getLong("id"),
              results.getLong("course_id"),
              results.getString("title"),
              results.getObject("deadline", OffsetDateTime.class),
              results.getInt("total_score"),
              AssignmentStatus.valueOf(results.getString("status")),
              results.getBoolean("similarity_check_enabled"),
              results.getBoolean("ai_grading_enabled")
          ));
        }
        return assignments;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to list assignments", error);
    }
  }

  @Override
  public AssignmentSummary createAssignment(CreateAssignmentRequest request) {
    try (var connection = connect()) {
      connection.setAutoCommit(false);
      try {
        var assignment = insertAssignment(connection, request);
        linkAssignmentClasses(connection, assignment.id(), request);
        connection.commit();
        return assignment;
      } catch (SQLException error) {
        connection.rollback();
        throw error;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to create assignment", error);
    }
  }

  @Override
  public AssignmentSummary publishAssignment(Long assignmentId) {
    var sql = "UPDATE assignments SET status = ? WHERE id = ?";
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setString(1, AssignmentStatus.PUBLISHED.name());
      statement.setLong(2, assignmentId);
      if (statement.executeUpdate() == 0) {
        throw new IllegalArgumentException("Assignment not found: " + assignmentId);
      }
      return findAssignment(connection, assignmentId);
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to publish assignment", error);
    }
  }

  private AssignmentSummary findAssignment(Connection connection, Long assignmentId) throws SQLException {
    var sql = """
        SELECT id, course_id, title, deadline, total_score, status, similarity_check_enabled, ai_grading_enabled
        FROM assignments
        WHERE id = ?
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, assignmentId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return new AssignmentSummary(
              results.getLong("id"),
              results.getLong("course_id"),
              results.getString("title"),
              results.getObject("deadline", OffsetDateTime.class),
              results.getInt("total_score"),
              AssignmentStatus.valueOf(results.getString("status")),
              results.getBoolean("similarity_check_enabled"),
              results.getBoolean("ai_grading_enabled")
          );
        }
      }
    }
    throw new IllegalArgumentException("Assignment not found: " + assignmentId);
  }

  private AssignmentSummary insertAssignment(Connection connection, CreateAssignmentRequest request) throws SQLException {
    var sql = """
        INSERT INTO assignments (
          course_id, title, description, deadline, total_score, status, similarity_check_enabled, ai_grading_enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """;
    var totalScore = request.totalScore() == null ? 100 : request.totalScore();
    try (var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      statement.setLong(1, request.courseId());
      statement.setString(2, request.title());
      statement.setString(3, request.description());
      statement.setObject(4, request.deadline());
      statement.setInt(5, totalScore);
      statement.setString(6, AssignmentStatus.DRAFT.name());
      statement.setBoolean(7, request.similarityCheckEnabled());
      statement.setBoolean(8, request.aiGradingEnabled());
      statement.executeUpdate();
      return new AssignmentSummary(
          generatedId(statement),
          request.courseId(),
          request.title(),
          request.deadline(),
          totalScore,
          AssignmentStatus.DRAFT,
          request.similarityCheckEnabled(),
          request.aiGradingEnabled()
      );
    }
  }

  private void linkAssignmentClasses(Connection connection, Long assignmentId, CreateAssignmentRequest request) throws SQLException {
    if (request.classIds() == null || request.classIds().isEmpty()) {
      return;
    }
    try (var statement = connection.prepareStatement(
        "INSERT INTO assignment_classes (assignment_id, class_id) VALUES (?, ?) ON CONFLICT DO NOTHING")) {
      for (var classId : request.classIds()) {
        if (classId == null) {
          continue;
        }
        statement.setLong(1, assignmentId);
        statement.setLong(2, classId);
        statement.addBatch();
      }
      statement.executeBatch();
    }
  }

  private Connection connect() throws SQLException {
    if (username == null || username.isBlank()) {
      return DriverManager.getConnection(url);
    }
    return DriverManager.getConnection(url, username, password);
  }

  private static Long generatedId(PreparedStatement statement) throws SQLException {
    try (var keys = statement.getGeneratedKeys()) {
      if (keys.next()) {
        return keys.getLong(1);
      }
    }
    throw new SQLException("Insert did not return a generated id");
  }
}
