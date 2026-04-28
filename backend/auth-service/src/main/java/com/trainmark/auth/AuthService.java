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
    var role = username.toLowerCase().contains("student") ? RoleCode.STUDENT : RoleCode.TEACHER;
    var name = role == RoleCode.STUDENT ? "张三" : "王老师";
    var user = new LoginResponse.UserProfile(1L, name, username, List.of(role));
    var issuedAt = Instant.now().toString();
    return new LoginResponse(token("access", username, issuedAt), token("refresh", username, issuedAt), user);
  }

  private String token(String type, String username, String issuedAt) {
    var payload = "%s:%s:%s".formatted(type, username, issuedAt);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
  }
}
