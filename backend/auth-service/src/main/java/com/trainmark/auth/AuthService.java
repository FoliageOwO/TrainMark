package com.trainmark.auth;

import com.trainmark.shared.RoleCode;
import com.trainmark.shared.dto.LoginRequest;
import com.trainmark.shared.dto.LoginResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private final AuthUserStore authUserStore;
  private final SecretKey signingKey;
  private final long accessTokenTtlSeconds;
  private final long refreshTokenTtlSeconds;

  public AuthService(
      AuthUserStore authUserStore,
      @Value("${trainmark.auth.jwt-secret:}") String jwtSecret,
      @Value("${trainmark.auth.access-token-ttl-seconds:3600}") long accessTokenTtlSeconds,
      @Value("${trainmark.auth.refresh-token-ttl-seconds:86400}") long refreshTokenTtlSeconds
  ) {
    this.authUserStore = authUserStore;
    this.accessTokenTtlSeconds = accessTokenTtlSeconds;
    this.refreshTokenTtlSeconds = refreshTokenTtlSeconds;
    if (jwtSecret != null && !jwtSecret.isBlank()) {
      this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    } else {
      // Generate a default key for development. Production should always set trainmark.auth.jwt-secret.
      this.signingKey = Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS256);
    }
  }

  public LoginResponse login(LoginRequest request) {
    return authUserStore.findByLogin(request.username())
        .map(this::loginUser)
        .orElseGet(() -> fallbackLogin(request.username()));
  }

  public LoginResponse.UserProfile currentUser(String authorizationHeader) {
    return currentAuthUser(authorizationHeader)
        .map(this::profile)
        .orElseGet(() -> mockUser("teacher").user());
  }

  public LoginResponse refresh(String authorizationHeader) {
    return currentAuthUser(authorizationHeader)
        .map(this::loginUser)
        .orElseGet(() -> mockUser("teacher"));
  }

  public void logout(String authorizationHeader) {
    currentAuthUser(authorizationHeader);
  }

  private Optional<AuthUserStore.AuthUser> currentAuthUser(String authorizationHeader) {
    if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
      if (authUserStore.allowsMockFallback()) {
        return Optional.empty();
      }
      throw new IllegalArgumentException("Authentication is required");
    }
    var username = usernameFromBearer(authorizationHeader);
    if (username.isEmpty()) {
      if (authUserStore.allowsMockFallback()) {
        return Optional.empty();
      }
      throw new IllegalArgumentException("Invalid access token");
    }
    return authUserStore.findByLogin(username.get())
        .or(() -> fallbackAuthUser(username.get()));
  }

  public LoginResponse mockUser(String username) {
    var role = roleFor(username);
    var name = nameFor(role);
    var user = new LoginResponse.UserProfile(idFor(role), name, username, List.of(role));
    var now = new Date();
    var accessToken = jwtToken("access", username, user.roles(), now, accessTokenTtlSeconds);
    var refreshToken = jwtToken("refresh", username, user.roles(), now, refreshTokenTtlSeconds);
    return new LoginResponse(accessToken, refreshToken, user);
  }

  private LoginResponse loginUser(AuthUserStore.AuthUser authUser) {
    var now = new Date();
    var username = authUser.username();
    var roles = authUser.roles();
    var accessToken = jwtToken("access", username, roles, now, accessTokenTtlSeconds);
    var refreshToken = jwtToken("refresh", username, roles, now, refreshTokenTtlSeconds);
    return new LoginResponse(accessToken, refreshToken, profile(authUser));
  }

  private LoginResponse fallbackLogin(String username) {
    if (authUserStore.allowsMockFallback()) {
      return mockUser(username);
    }
    throw new IllegalArgumentException("Invalid username or password");
  }

  private Optional<AuthUserStore.AuthUser> fallbackAuthUser(String username) {
    if (authUserStore.allowsMockFallback()) {
      var user = mockUser(username).user();
      return Optional.of(new AuthUserStore.AuthUser(user.id(), user.name(), user.username(), user.roles()));
    }
    throw new IllegalArgumentException("Invalid access token");
  }

  private LoginResponse.UserProfile profile(AuthUserStore.AuthUser authUser) {
    return new LoginResponse.UserProfile(authUser.id(), authUser.name(), authUser.username(), authUser.roles());
  }

  private Optional<String> usernameFromBearer(String authorizationHeader) {
    try {
      var token = authorizationHeader.substring("Bearer ".length());
      var claims = Jwts.parser()
          .verifyWith(signingKey)
          .build()
          .parseSignedClaims(token)
          .getPayload();
      var username = claims.get("username", String.class);
      var type = claims.getSubject();
      if (username == null || username.isBlank() || !"access".equals(type)) {
        return Optional.empty();
      }
      // Check expiration
      var exp = claims.getExpiration();
      if (exp != null && exp.before(new Date())) {
        return Optional.empty();
      }
      return Optional.of(username);
    } catch (Exception error) {
      return Optional.empty();
    }
  }

  private String jwtToken(String type, String username, List<RoleCode> roles, Date issuedAt, long ttlSeconds) {
    var expiresAt = new Date(issuedAt.getTime() + ttlSeconds * 1000);
    var rolesStr = roles.stream().map(Enum::name).reduce((a, b) -> a + "," + b).orElse("");
    return Jwts.builder()
        .subject(type)
        .claim("username", username)
        .claim("roles", rolesStr)
        .issuedAt(issuedAt)
        .expiration(expiresAt)
        .signWith(signingKey)
        .compact();
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
}
