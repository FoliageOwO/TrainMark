package com.trainmark.auth;

import com.trainmark.shared.RoleCode;
import com.trainmark.shared.dto.LoginRequest;
import com.trainmark.shared.dto.LoginResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private final AuthUserStore authUserStore;

  public AuthService(AuthUserStore authUserStore) {
    this.authUserStore = authUserStore;
  }

  public LoginResponse login(LoginRequest request) {
    return authUserStore.findByLogin(request.username())
        .map(this::loginUser)
        .orElseGet(() -> fallbackLogin(request.username()));
  }

  public LoginResponse.UserProfile currentUser(String authorizationHeader) {
    var username = usernameFromBearer(authorizationHeader);
    if (username.isEmpty()) {
      if (authUserStore.allowsMockFallback()) {
        return mockUser("teacher").user();
      }
      throw new IllegalArgumentException("Authentication is required");
    }
    return authUserStore.findByLogin(username.get())
        .map(this::profile)
        .orElseGet(() -> fallbackProfile(username.get()));
  }

  public LoginResponse mockUser(String username) {
    var role = roleFor(username);
    var name = nameFor(role);
    var user = new LoginResponse.UserProfile(idFor(role), name, username, List.of(role));
    var issuedAt = Instant.now().toString();
    return new LoginResponse(token("access", username, issuedAt), token("refresh", username, issuedAt), user);
  }

  private LoginResponse loginUser(AuthUserStore.AuthUser authUser) {
    var issuedAt = Instant.now().toString();
    var username = authUser.username();
    return new LoginResponse(token("access", username, issuedAt), token("refresh", username, issuedAt), profile(authUser));
  }

  private LoginResponse fallbackLogin(String username) {
    if (authUserStore.allowsMockFallback()) {
      return mockUser(username);
    }
    throw new IllegalArgumentException("Invalid username or password");
  }

  private LoginResponse.UserProfile fallbackProfile(String username) {
    if (authUserStore.allowsMockFallback()) {
      return mockUser(username).user();
    }
    throw new IllegalArgumentException("Invalid access token");
  }

  private LoginResponse.UserProfile profile(AuthUserStore.AuthUser authUser) {
    return new LoginResponse.UserProfile(authUser.id(), authUser.name(), authUser.username(), authUser.roles());
  }

  private Optional<String> usernameFromBearer(String authorizationHeader) {
    if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
      return Optional.empty();
    }
    try {
      var token = authorizationHeader.substring("Bearer ".length());
      var decoded = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
      var parts = decoded.split(":", 3);
      if (parts.length < 3 || !"access".equals(parts[0]) || parts[1].isBlank()) {
        return Optional.empty();
      }
      return Optional.of(parts[1]);
    } catch (IllegalArgumentException error) {
      return Optional.empty();
    }
  }

  private RoleCode roleFor(String username) {
    var normalized = username.toLowerCase();
    if (normalized.contains("student")) {
      return RoleCode.STUDENT;
    }
    if (isStudentNumber(normalized)) {
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

  private boolean isStudentNumber(String username) {
    return username.length() >= 6 && username.chars().allMatch(Character::isDigit);
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
