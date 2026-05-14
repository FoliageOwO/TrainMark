package com.trainmark.auth;

import com.trainmark.shared.RoleCode;
import com.trainmark.shared.dto.LoginRequest;
import com.trainmark.shared.dto.LoginResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  public LoginResponse login(LoginRequest request) {
    return mockUser(request.username());
  }

  public LoginResponse mockUser(String username) {
    var role = roleFor(username);
    var name = nameFor(role);
    var user = new LoginResponse.UserProfile(idFor(role), name, username, List.of(role));
    var issuedAt = Instant.now().toString();
    return new LoginResponse(token("access", username, issuedAt), token("refresh", username, issuedAt), user);
  }

  private RoleCode roleFor(String username) {
    var normalized = username.toLowerCase();
    if (normalized.contains("student")) {
      return RoleCode.STUDENT;
    }
    if (normalized.contains("admin")) {
      return RoleCode.ADMIN;
    }
    if (normalized.contains("owner")) {
      return RoleCode.COURSE_OWNER;
    }
    if (normalized.contains("supervisor")) {
      return RoleCode.SUPERVISOR;
    }
    return RoleCode.TEACHER;
  }

  private String nameFor(RoleCode role) {
    return switch (role) {
      case STUDENT -> "张三";
      case ADMIN -> "系统管理员";
      case COURSE_OWNER -> "刘主任";
      case SUPERVISOR -> "陈督导";
      case TEACHER -> "王老师";
    };
  }

  private Long idFor(RoleCode role) {
    return switch (role) {
      case TEACHER -> 1L;
      case STUDENT -> 2L;
      case COURSE_OWNER -> 3L;
      case SUPERVISOR -> 4L;
      case ADMIN -> 5L;
    };
  }

  private String token(String type, String username, String issuedAt) {
    var payload = "%s:%s:%s".formatted(type, username, issuedAt);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
  }
}
