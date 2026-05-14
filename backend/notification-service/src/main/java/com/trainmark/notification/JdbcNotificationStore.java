package com.trainmark.notification;

import com.trainmark.shared.NotificationChannel;
import com.trainmark.shared.NotificationStatus;
import com.trainmark.shared.dto.ReminderRequest;
import com.trainmark.shared.dto.ReminderResult;
import com.trainmark.shared.dto.SubmissionCollectionOverview;
import com.trainmark.shared.dto.UnsubmittedStudent;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.notification.store", havingValue = "jdbc")
public class JdbcNotificationStore implements NotificationStore {
  private final String url;
  private final String username;
  private final String password;

  public JdbcNotificationStore(
      @Value("${trainmark.notification.jdbc.url:}") String url,
      @Value("${trainmark.notification.jdbc.username:}") String username,
      @Value("${trainmark.notification.jdbc.password:}") String password
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException("trainmark.notification.jdbc.url is required when trainmark.notification.store=jdbc");
    }
    this.url = url;
    this.username = username;
    this.password = password;
  }

  @Override
  public SubmissionCollectionOverview collectionOverview(Long assignmentId) {
    var sql = """
        WITH assigned_students AS (
          SELECT DISTINCT cs.student_id
          FROM assignment_classes ac
          JOIN class_students cs ON cs.class_id = ac.class_id
          WHERE ac.assignment_id = ?
        ),
        latest_submissions AS (
          SELECT DISTINCT ON (s.student_id) s.student_id, s.status, s.submitted_at, a.deadline
          FROM submissions s
          JOIN assignments a ON a.id = s.assignment_id
          WHERE s.assignment_id = ?
          ORDER BY s.student_id, s.version DESC, s.submitted_at DESC
        )
        SELECT
          (SELECT count(*) FROM assigned_students) AS total_students,
          (SELECT count(*) FROM latest_submissions) AS submitted,
          (SELECT count(*) FROM assigned_students ast
             WHERE NOT EXISTS (SELECT 1 FROM latest_submissions ls WHERE ls.student_id = ast.student_id)) AS unsubmitted,
          (SELECT count(*) FROM latest_submissions WHERE submitted_at > deadline OR status = 'LATE_SUBMITTED') AS late_submitted,
          (SELECT count(*) FROM latest_submissions WHERE status = 'PROCESSING') AS processing,
          (SELECT count(*) FROM latest_submissions WHERE status IN ('REVIEWED', 'PUBLISHED')) AS reviewed,
          (SELECT count(*) FROM latest_submissions WHERE status = 'PUBLISHED') AS published
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, assignmentId);
      statement.setLong(2, assignmentId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return new SubmissionCollectionOverview(
              assignmentId,
              results.getInt("total_students"),
              results.getInt("submitted"),
              results.getInt("unsubmitted"),
              results.getInt("late_submitted"),
              results.getInt("processing"),
              results.getInt("reviewed"),
              results.getInt("published")
          );
        }
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to load collection overview", error);
    }
    return new SubmissionCollectionOverview(assignmentId, 0, 0, 0, 0, 0, 0, 0);
  }

  @Override
  public Collection<UnsubmittedStudent> unsubmittedStudents(Long assignmentId) {
    var sql = """
        SELECT DISTINCT u.id, u.student_no, u.name, tc.name AS class_name, u.email
        FROM assignment_classes ac
        JOIN teaching_classes tc ON tc.id = ac.class_id
        JOIN class_students cs ON cs.class_id = tc.id
        JOIN users u ON u.id = cs.student_id
        WHERE ac.assignment_id = ?
          AND NOT EXISTS (
            SELECT 1 FROM submissions s
            WHERE s.assignment_id = ac.assignment_id AND s.student_id = u.id
          )
        ORDER BY tc.name, u.student_no, u.id
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, assignmentId);
      try (var results = statement.executeQuery()) {
        var students = new ArrayList<UnsubmittedStudent>();
        while (results.next()) {
          students.add(new UnsubmittedStudent(
              results.getLong("id"),
              results.getString("student_no"),
              results.getString("name"),
              results.getString("class_name"),
              results.getString("email")
          ));
        }
        return students;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to load unsubmitted students", error);
    }
  }

  @Override
  public ReminderResult remind(ReminderRequest request) {
    var channels = request.channels().isEmpty() ? List.of(NotificationChannel.IN_APP) : request.channels();
    var scheduledAt = OffsetDateTime.now();
    try (var connection = connect()) {
      connection.setAutoCommit(false);
      try {
        var messageCount = insertNotificationEvents(connection, request, channels, scheduledAt);
        connection.commit();
        return new ReminderResult(
            request.assignmentId(),
            request.studentIds().size(),
            messageCount,
            channels,
            NotificationStatus.SENT,
            scheduledAt
        );
      } catch (SQLException | RuntimeException error) {
        connection.rollback();
        throw error;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to create reminder notifications", error);
    }
  }

  private int insertNotificationEvents(
      Connection connection,
      ReminderRequest request,
      List<NotificationChannel> channels,
      OffsetDateTime scheduledAt
  ) throws SQLException {
    var sql = """
        INSERT INTO notification_events (
          assignment_id, recipient_id, channel, status, message, scheduled_at, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """;
    var messageCount = 0;
    try (var statement = connection.prepareStatement(sql)) {
      for (var studentId : request.studentIds()) {
        if (studentId == null) {
          continue;
        }
        for (var channel : channels) {
          statement.setLong(1, request.assignmentId());
          statement.setLong(2, studentId);
          statement.setString(3, channel.name());
          statement.setString(4, NotificationStatus.SENT.name());
          statement.setString(5, request.message());
          statement.setObject(6, scheduledAt);
          statement.setObject(7, scheduledAt);
          statement.addBatch();
          messageCount++;
        }
      }
      statement.executeBatch();
    }
    return messageCount;
  }

  private Connection connect() throws SQLException {
    if (username == null || username.isBlank()) {
      return DriverManager.getConnection(url);
    }
    return DriverManager.getConnection(url, username, password);
  }
}
