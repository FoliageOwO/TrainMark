package com.trainmark.auth;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.RoleCode;
import com.trainmark.shared.dto.LoginRequest;
import com.trainmark.shared.dto.LoginResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    return ApiResponse.ok(authService.login(request));
  }

  @PostMapping("/refresh")
  public ApiResponse<LoginResponse> refresh() {
    return ApiResponse.ok(authService.mockUser("teacher"));
  }

  @PostMapping("/logout")
  public ApiResponse<Void> logout() {
    return ApiResponse.ok(null);
  }

  @RequestMapping("/me")
  public ApiResponse<LoginResponse.UserProfile> me() {
    return ApiResponse.ok(new LoginResponse.UserProfile(1L, "王老师", "teacher", List.of(RoleCode.TEACHER)));
  }
}
