package com.trainmark.auth;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.LoginRequest;
import com.trainmark.shared.dto.LoginResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RequestHeader;
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
  public ApiResponse<LoginResponse> refresh(
      @RequestHeader(value = "Authorization", required = false) String authorizationHeader
  ) {
    return ApiResponse.ok(authService.refresh(authorizationHeader));
  }

  @PostMapping("/logout")
  public ApiResponse<Void> logout(
      @RequestHeader(value = "Authorization", required = false) String authorizationHeader
  ) {
    authService.logout(authorizationHeader);
    return ApiResponse.ok(null);
  }

  @RequestMapping("/me")
  public ApiResponse<LoginResponse.UserProfile> me(
      @RequestHeader(value = "Authorization", required = false) String authorizationHeader
  ) {
    return ApiResponse.ok(authService.currentUser(authorizationHeader));
  }
}
