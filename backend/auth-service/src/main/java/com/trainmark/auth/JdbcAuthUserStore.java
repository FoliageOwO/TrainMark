package com.trainmark.auth;

import com.trainmark.shared.RoleCode;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.auth.store", havingValue = "jdbc")
public class JdbcAuthUserStore implements AuthUserStore {
  private final String url;
  private final String username;
  private final String password;

  public JdbcAuthUserStore(
      @Value("${trainmark.auth.jdbc.url:}") String url,
      @Value("${trainmark.auth.jdbc.username:}") String username,
      @Value("${trainmark.auth.jdbc.password:}") String password
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException("trainmark.auth.jdbc.url is required when trainmark.auth.store=jdbc");
    }
    this.url = url;
    this.username = username;
    this.password = password;
  }

  @Override
  public Optional<AuthUser> findByLogin(String login) {
    return findExactUser(login).or(() -> findDemoRoleUser(login));
  }

  @Override
  public boolean allowsMockFallback() {
    return false;
  }

  private Optional<AuthUser> findExactUser(String login) {
    var sql = """
        SELECT id, name, username
        FROM users
        WHERE status = 'ACTIVE' AND (username = ? OR student_no = ? OR teacher_no = ?)
        ORDER BY id
        LIMIT 1
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setString(1, login);
      statement.setString(2, login);
      statement.setString(3, login);
      try (var results = statement.executeQuery()) {
        if (!results.next()) {
          return Optional.empty();
        }
        return Optional.of(toUser(connection, results));
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to find auth user", error);
    }
  }

  private Optional<AuthUser> findDemoRoleUser(String login) {
    var role = demoRole(login);
    if (role.isEmpty()) {
      return Optional.empty();
    }
    var sql = """
        SELECT u.id, u.name, u.username
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE u.status = 'ACTIVE' AND r.code = ?
        ORDER BY u.id
        LIMIT 1
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setString(1, role.get().name());
      try (var results = statement.executeQuery()) {
        if (!results.next()) {
          return Optional.empty();
        }
        return Optional.of(toUser(connection, results));
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to find demo auth user", error);
    }
  }

  private AuthUser toUser(Connection connection, ResultSet results) throws SQLException {
    var userId = results.getLong("id");
    return new AuthUser(
        userId,
        results.getString("name"),
        results.getString("username"),
        listRoles(connection, userId)
    );
  }

  private ArrayList<RoleCode> listRoles(Connection connection, Long userId) throws SQLException {
    var sql = """
        SELECT r.code
        FROM roles r
        JOIN user_roles ur ON ur.role_id = r.id
        WHERE ur.user_id = ?
        ORDER BY r.id
        """;
    try (var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, userId);
      try (var results = statement.executeQuery()) {
        var roles = new ArrayList<RoleCode>();
        while (results.next()) {
          roles.add(RoleCode.valueOf(results.getString("code")));
        }
        return roles;
      }
    }
  }

  private Optional<RoleCode> demoRole(String login) {
    var normalized = login.toLowerCase();
    if (normalized.contains("student")) {
      return Optional.of(RoleCode.STUDENT);
    }
    if (normalized.contains("teacher")) {
      return Optional.of(RoleCode.TEACHER);
    }
    if (normalized.contains("admin")) {
      return Optional.of(RoleCode.ADMIN);
    }
    if (normalized.contains("owner")) {
      return Optional.of(RoleCode.COURSE_OWNER);
    }
    if (normalized.contains("supervisor")) {
      return Optional.of(RoleCode.SUPERVISOR);
    }
    return Optional.empty();
  }

  private Connection connect() throws SQLException {
    return DriverManager.getConnection(url, username, password);
  }
}
