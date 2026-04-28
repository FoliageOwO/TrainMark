package com.trainmark.shared.dto;

import com.trainmark.shared.RoleCode;
import java.util.List;

public record LoginResponse(
    String accessToken,
    String refreshToken,
    UserProfile user
) {
  public record UserProfile(
      Long id,
      String name,
      String username,
      List<RoleCode> roles
  ) {}
}
