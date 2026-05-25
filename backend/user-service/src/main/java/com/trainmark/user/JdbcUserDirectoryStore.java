package com.trainmark.user;

import com.trainmark.shared.OrganizationType;
import com.trainmark.shared.RoleCode;
import com.trainmark.shared.UserStatus;
import com.trainmark.shared.dto.CreateOrganizationRequest;
import com.trainmark.shared.dto.CreateUserRequest;
import com.trainmark.shared.dto.OrganizationSummary;
import com.trainmark.shared.dto.StudentImportRequest;
import com.trainmark.shared.dto.StudentImportResult;
import com.trainmark.shared.dto.UserSummary;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.user.store", havingValue = "jdbc")
public class JdbcUserDirectoryStore implements UserDirectoryStore {
  private static final String DEV_PASSWORD_HASH = "local-dev-disabled";

  private final String url;
  private final String username;
  private final String password;

  public JdbcUserDirectoryStore(
      @Value("${trainmark.user.jdbc.url:}") String url,
      @Value("${trainmark.user.jdbc.username:}") String username,
      @Value("${trainmark.user.jdbc.password:}") String password
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException("trainmark.user.jdbc.url is required when trainmark.user.store=jdbc");
    }
    this.url = url;
    this.username = username;
    this.password = password;
  }

  @Override
  public Collection<OrganizationSummary> listOrganizations(Long parentId) {
    var sql = "SELECT id, parent_id, name, type FROM organizations";
    if (parentId != null) {
      sql += " WHERE parent_id = ?";
    }
    sql += " ORDER BY id";

    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      if (parentId != null) {
        statement.setLong(1, parentId);
      }
      try (var results = statement.executeQuery()) {
        var organizations = new ArrayList<OrganizationSummary>();
        while (results.next()) {
          organizations.add(new OrganizationSummary(
              results.getLong("id"),
              nullableLong(results, "parent_id"),
              results.getString("name"),
              OrganizationType.valueOf(results.getString("type"))
          ));
        }
        return organizations;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to list organizations", error);
    }
  }

  @Override
  public OrganizationSummary createOrganization(CreateOrganizationRequest request) {
    var sql = "INSERT INTO organizations (parent_id, name, type) VALUES (?, ?, ?)";
    try (var connection = connect();
        var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      setNullableLong(statement, 1, request.parentId());
      statement.setString(2, request.name());
      statement.setString(3, request.type().name());
      statement.executeUpdate();
      var id = generatedId(statement);
      return new OrganizationSummary(id, request.parentId(), request.name(), request.type());
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to create organization", error);
    }
  }

  @Override
  public Collection<UserSummary> listUsers(Long organizationId, RoleCode role) {
    var sql = """
        SELECT u.id, u.organization_id, u.username, u.name, u.student_no, u.teacher_no,
               u.email, u.phone, u.status
        FROM users u
        """;
    if (role != null) {
      sql += """
          WHERE EXISTS (
            SELECT 1
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id AND r.code = ?
          )
          """;
      if (organizationId != null) {
        sql += " AND u.organization_id = ?\n";
      }
    } else if (organizationId != null) {
      sql += "WHERE u.organization_id = ?\n";
    }
    sql += "ORDER BY u.id";

    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      var parameterIndex = 1;
      if (role != null) {
        statement.setString(parameterIndex++, role.name());
      }
      if (organizationId != null) {
        statement.setLong(parameterIndex, organizationId);
      }
      try (var results = statement.executeQuery()) {
        var users = new ArrayList<UserSummary>();
        while (results.next()) {
          var userId = results.getLong("id");
          users.add(new UserSummary(
              userId,
              nullableLong(results, "organization_id"),
              results.getString("username"),
              results.getString("name"),
              results.getString("student_no"),
              results.getString("teacher_no"),
              results.getString("email"),
              results.getString("phone"),
              UserStatus.valueOf(results.getString("status")),
              listRoles(connection, userId)
          ));
        }
        return users;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to list users", error);
    }
  }

  @Override
  public Collection<UserSummary> listClassStudents(Long classId) {
    var sql = """
        SELECT u.id, u.organization_id, u.username, u.name, u.student_no, u.teacher_no,
               u.email, u.phone, u.status
        FROM class_students cs
        JOIN users u ON u.id = cs.student_id
        WHERE cs.class_id = ?
        ORDER BY u.id
        """;

    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, classId);
      try (var results = statement.executeQuery()) {
        var users = new ArrayList<UserSummary>();
        while (results.next()) {
          var userId = results.getLong("id");
          users.add(new UserSummary(
              userId,
              nullableLong(results, "organization_id"),
              results.getString("username"),
              results.getString("name"),
              results.getString("student_no"),
              results.getString("teacher_no"),
              results.getString("email"),
              results.getString("phone"),
              UserStatus.valueOf(results.getString("status")),
              listRoles(connection, userId)
          ));
        }
        return users;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to list class students", error);
    }
  }

  @Override
  public UserSummary createUser(CreateUserRequest request) {
    try (var connection = connect()) {
      connection.setAutoCommit(false);
      try {
        var user = insertUser(connection, request);
        connection.commit();
        return user;
      } catch (SQLException error) {
        connection.rollback();
        throw error;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to create user", error);
    }
  }

  @Override
  public StudentImportResult importStudents(StudentImportRequest request) {
    var warnings = new ArrayList<String>();
    var rows = request.rows() == null ? List.<StudentImportRequest.StudentImportRow>of() : request.rows();
    var imported = 0;
    var skipped = 0;

    try (var connection = connect()) {
      connection.setAutoCommit(false);
      try {
        for (var row : rows) {
          if (row.studentNo() == null || row.studentNo().isBlank() || row.name() == null || row.name().isBlank()) {
            skipped++;
            warnings.add("存在缺少学号或姓名的记录，已跳过");
            continue;
          }
          var existingStudentId = findStudentId(connection, row.studentNo());
          if (existingStudentId != null) {
            if (linkClassStudent(connection, request.classId(), existingStudentId)) {
              imported++;
            } else {
              skipped++;
              warnings.add("学号 " + row.studentNo() + " 已在当前班级，已跳过");
            }
            continue;
          }
          var user = insertUser(connection, new CreateUserRequest(
              null,
              row.studentNo(),
              row.name(),
              row.studentNo(),
              null,
              row.email(),
              row.phone(),
              List.of(RoleCode.STUDENT)
          ));
          linkClassStudent(connection, request.classId(), user.id());
          imported++;
        }
        connection.commit();
      } catch (SQLException error) {
        connection.rollback();
        throw error;
      }
      return new StudentImportResult(rows.size(), imported, skipped, warnings);
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to import students", error);
    }
  }

  private UserSummary insertUser(Connection connection, CreateUserRequest request) throws SQLException {
    var sql = """
        INSERT INTO users (
          organization_id, username, password_hash, name, student_no, teacher_no, email, phone, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
    try (var statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      setNullableLong(statement, 1, request.organizationId());
      statement.setString(2, request.username());
      statement.setString(3, DEV_PASSWORD_HASH);
      statement.setString(4, request.name());
      statement.setString(5, request.studentNo());
      statement.setString(6, request.teacherNo());
      statement.setString(7, request.email());
      statement.setString(8, request.phone());
      statement.setString(9, UserStatus.ACTIVE.name());
      statement.executeUpdate();
      var userId = generatedId(statement);
      assignRoles(connection, userId, request.roles());
      return new UserSummary(
          userId,
          request.organizationId(),
          request.username(),
          request.name(),
          request.studentNo(),
          request.teacherNo(),
          request.email(),
          request.phone(),
          UserStatus.ACTIVE,
          request.roles()
      );
    }
  }

  private boolean linkClassStudent(Connection connection, Long classId, Long studentId) throws SQLException {
    if (classId == null || studentId == null) {
      return false;
    }
    try (var statement = connection.prepareStatement(
        "INSERT INTO class_students (class_id, student_id) VALUES (?, ?) ON CONFLICT DO NOTHING")) {
      statement.setLong(1, classId);
      statement.setLong(2, studentId);
      return statement.executeUpdate() > 0;
    }
  }

  private void assignRoles(Connection connection, Long userId, List<RoleCode> roles) throws SQLException {
    for (var role : roles) {
      var roleId = roleId(connection, role);
      try (var statement = connection.prepareStatement(
          "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON CONFLICT DO NOTHING")) {
        statement.setLong(1, userId);
        statement.setLong(2, roleId);
        statement.executeUpdate();
      }
    }
  }

  private Long roleId(Connection connection, RoleCode role) throws SQLException {
    try (var insert = connection.prepareStatement(
        "INSERT INTO roles (code, name) VALUES (?, ?) ON CONFLICT (code) DO NOTHING")) {
      insert.setString(1, role.name());
      insert.setString(2, role.name());
      insert.executeUpdate();
    }
    try (var statement = connection.prepareStatement("SELECT id FROM roles WHERE code = ?")) {
      statement.setString(1, role.name());
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return results.getLong("id");
        }
      }
    }
    throw new IllegalStateException("Role not found: " + role);
  }

  private List<RoleCode> listRoles(Connection connection, Long userId) throws SQLException {
    var sql = """
        SELECT r.code
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = ?
        ORDER BY r.code
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

  private Long findStudentId(Connection connection, String studentNo) throws SQLException {
    try (var statement = connection.prepareStatement("SELECT id FROM users WHERE student_no = ?")) {
      statement.setString(1, studentNo);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return results.getLong("id");
        }
        return null;
      }
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

  private static Long nullableLong(java.sql.ResultSet results, String column) throws SQLException {
    var value = results.getLong(column);
    return results.wasNull() ? null : value;
  }

  private static void setNullableLong(PreparedStatement statement, int index, Long value) throws SQLException {
    if (value == null) {
      statement.setNull(index, java.sql.Types.BIGINT);
    } else {
      statement.setLong(index, value);
    }
  }
}
