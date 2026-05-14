package com.trainmark.auth;

import com.trainmark.shared.RoleCode;
import java.util.List;
import java.util.Optional;

public interface AuthUserStore {
  Optional<AuthUser> findByLogin(String username);

  record AuthUser(
      Long id,
      String name,
      String username,
      List<RoleCode> roles
  ) {}
}
