package com.trainmark.admin;

import com.trainmark.shared.dto.SystemSettingSummary;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collection;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.admin.store", havingValue = "jdbc")
public class JdbcSystemSettingStore implements SystemSettingStore {
  private final String url;
  private final String username;
  private final String password;

  public JdbcSystemSettingStore(
      @Value("${trainmark.admin.jdbc.url:}") String url,
      @Value("${trainmark.admin.jdbc.username:}") String username,
      @Value("${trainmark.admin.jdbc.password:}") String password
  ) {
    if (url == null || url.isBlank()) {
      throw new IllegalStateException("trainmark.admin.jdbc.url is required when trainmark.admin.store=jdbc");
    }
    this.url = url;
    this.username = username;
    this.password = password;
  }

  @Override
  public Collection<SystemSettingSummary> list(String category) {
    var sql = """
        SELECT setting_key, display_name, setting_value, category, sensitive
        FROM system_settings
        """;
    if (category != null) {
      sql += "WHERE category = ?\n";
    }
    sql += "ORDER BY category, setting_key";

    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      if (category != null) {
        statement.setString(1, category);
      }
      try (var results = statement.executeQuery()) {
        var settings = new ArrayList<SystemSettingSummary>();
        while (results.next()) {
          var sensitive = results.getBoolean("sensitive");
          settings.add(new SystemSettingSummary(
              results.getString("setting_key"),
              results.getString("display_name"),
              sensitive ? "******" : results.getString("setting_value"),
              results.getString("category"),
              sensitive
          ));
        }
        return settings;
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to load system settings", error);
    }
  }

  private java.sql.Connection connect() throws SQLException {
    if (username == null || username.isBlank()) {
      return DriverManager.getConnection(url);
    }
    return DriverManager.getConnection(url, username, password);
  }
}
