package com.trainmark.notification;

import com.trainmark.shared.NotificationChannel;
import com.trainmark.shared.NotificationStatus;
import com.trainmark.shared.dto.CreateNotificationRequest;
import com.trainmark.shared.dto.NotificationSummary;
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
    var pending = createPendingReminder(request);
    return completeReminder(request, pending.scheduledAt());
  }

  @Override
  public ReminderResult createPendingReminder(ReminderRequest request) {
    var channels = request.channels().isEmpty() ? List.of(NotificationChannel.IN_APP) : request.channels();
    var scheduledAt = OffsetDateTime.now();
    try (var connection = connect()) {
      connection.setAutoCommit(false);
      try {
        var messageCount = insertNotificationEvents(connection, request, channels, NotificationStatus.PENDING, scheduledAt, null);
        connection.commit();
        return new ReminderResult(
            request.assignmentId(),
            request.studentIds().size(),
            messageCount,
            channels,
            NotificationStatus.PENDING,
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

  @Override
  public ReminderResult completeReminder(ReminderRequest request, OffsetDateTime scheduledAt) {
    var channels = request.channels().isEmpty() ? List.of(NotificationChannel.IN_APP) : request.channels();
    try (var connection = connect()) {
      var updated = updateReminderStatus(connection, request, channels, scheduledAt, NotificationStatus.SENT, OffsetDateTime.now());
      return new ReminderResult(
          request.assignmentId(),
          request.studentIds().size(),
          updated,
          channels,
          NotificationStatus.SENT,
          scheduledAt
      );
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to mark reminder notifications sent", error);
    }
  }

  @Override
  public void failReminder(ReminderRequest request, OffsetDateTime scheduledAt) {
    var channels = request.channels().isEmpty() ? List.of(NotificationChannel.IN_APP) : request.channels();
    try (var connection = connect()) {
      updateReminderStatus(connection, request, channels, scheduledAt, NotificationStatus.FAILED, null);
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to mark reminder notifications failed", error);
    }
  }

  @Override
  public NotificationSummary createNotification(CreateNotificationRequest request) {
    var sql = """
        INSERT INTO notification_events (
          assignment_id, recipient_id, channel, status, title, message, event_type, is_read, target_url,
          scheduled_at, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, false, ?, now(), now())
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
      if (request.assignmentId() == null) {
        statement.setNull(1, java.sql.Types.BIGINT);
      } else {
        statement.setLong(1, request.assignmentId());
      }
      statement.setLong(2, request.recipientId());
      statement.setString(3, NotificationChannel.IN_APP.name());
      statement.setString(4, NotificationStatus.SENT.name());
      statement.setString(5, request.title());
      statement.setString(6, request.message());
      statement.setString(7, request.type());
      statement.setString(8, request.targetUrl());
      statement.executeUpdate();
      try (var keys = statement.getGeneratedKeys()) {
        if (keys.next()) {
          return findNotification(connection, keys.getLong(1));
        }
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to create notification", error);
    }
    throw new IllegalStateException("Insert did not return a generated notification id");
  }

  @Override
  public Collection<NotificationSummary> listNotifications(Long userId, boolean unreadOnly) {
    var sql = """
        SELECT id, title, message, event_type AS type, is_read, target_url, created_at
        FROM notification_events
        WHERE recipient_id = ?
        """ + (unreadOnly ? " AND is_read = false" : "") + """
        ORDER BY created_at DESC, id DESC
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, userId);
      try (var results = statement.executeQuery()) {
        var items = new ArrayList<NotificationSummary>();
        while (results.next()) {
          items.add(new NotificationSummary(
              results.getLong("id"),
              results.getString("title"),
              results.getString("message"),
              results.getString("type"),
              results.getBoolean("is_read"),
              results.getString("target_url"),
              results.getObject("created_at", OffsetDateTime.class)
          ));
        }
        return items;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to load notifications", error);
    }
  }

  @Override
  public int markAsRead(Long notificationId, Long userId) {
    var sql = "UPDATE notification_events SET is_read = true WHERE id = ? AND recipient_id = ?";
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, notificationId);
      statement.setLong(2, userId);
      return statement.executeUpdate();
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to mark notification as read", error);
    }
  }

  @Override
  public int markAllAsRead(Long userId) {
    var sql = "UPDATE notification_events SET is_read = true WHERE recipient_id = ? AND is_read = false";
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, userId);
      return statement.executeUpdate();
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to mark all notifications as read", error);
    }
  }

  private int insertNotificationEvents(
      Connection connection,
      ReminderRequest request,
      List<NotificationChannel> channels,
      NotificationStatus status,
      OffsetDateTime scheduledAt,
      OffsetDateTime sentAt
  ) throws SQLException {
    var sql = """
        INSERT INTO notification_events (
          assignment_id, recipient_id, channel, status, title, message, event_type, is_read, target_url,
          scheduled_at, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, false, ?, ?, ?)
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
          statement.setString(4, status.name());
          statement.setString(5, "提交催交");
          statement.setString(6, request.message());
          statement.setString(7, "REMINDER");
          statement.setString(8, "/tasks/" + request.assignmentId());
          statement.setObject(9, scheduledAt);
          statement.setObject(10, sentAt);
          statement.addBatch();
          messageCount++;
        }
      }
      statement.executeBatch();
    }
    return messageCount;
  }

  private int updateReminderStatus(
      Connection connection,
      ReminderRequest request,
      List<NotificationChannel> channels,
      OffsetDateTime scheduledAt,
      NotificationStatus status,
      OffsetDateTime sentAt
  ) throws SQLException {
    var sql = """
        UPDATE notification_events
        SET status = ?, sent_at = ?
        WHERE assignment_id = ?
          AND recipient_id = ?
          AND channel = ?
          AND status = ?
          AND scheduled_at = ?
        """;
    var updated = 0;
    try (var statement = connection.prepareStatement(sql)) {
      for (var studentId : request.studentIds()) {
        if (studentId == null) {
          continue;
        }
        for (var channel : channels) {
          statement.setString(1, status.name());
          statement.setObject(2, sentAt);
          statement.setLong(3, request.assignmentId());
          statement.setLong(4, studentId);
          statement.setString(5, channel.name());
          statement.setString(6, NotificationStatus.PENDING.name());
          statement.setObject(7, scheduledAt);
          statement.addBatch();
        }
      }
      for (var count : statement.executeBatch()) {
        if (count > 0) {
          updated += count;
        }
      }
    }
    return updated;
  }

  private NotificationSummary findNotification(Connection connection, Long notificationId) throws SQLException {
    var sql = """
        SELECT id, title, message, event_type AS type, is_read, target_url, created_at
        FROM notification_events
        WHERE id = ?
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, notificationId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return new NotificationSummary(
              results.getLong("id"),
              results.getString("title"),
              results.getString("message"),
              results.getString("type"),
              results.getBoolean("is_read"),
              results.getString("target_url"),
              results.getObject("created_at", OffsetDateTime.class)
          );
        }
      }
    }
    throw new SQLException("Notification not found: " + notificationId);
  }

  private Connection connect() throws SQLException {
    if (username == null || username.isBlank()) {
      return DriverManager.getConnection(url);
    }
    return DriverManager.getConnection(url, username, password);
  }
}
