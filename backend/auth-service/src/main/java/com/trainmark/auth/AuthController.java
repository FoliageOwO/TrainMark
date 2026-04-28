package com.trainmark.auth;

import com.trainmark.shared.ApiResponse;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  @GetMapping("/me")
  public ApiResponse<Map<String, String>> me() {
    return ApiResponse.ok(Map.of("name", "王老师", "role", "TEACHER"));
  }
}
