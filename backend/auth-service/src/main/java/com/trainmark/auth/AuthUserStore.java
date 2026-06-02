package com.trainmark.auth;

import com.trainmark.shared.RoleCode;
import com.trainmark.shared.dto.RegisterRequest;
import java.util.List;
import java.util.Optional;

public interface AuthUserStore {
  Optional<AuthUser> findByLogin(String username);

  default void updatePasswordHash(Long userId, String passwordHash) {
    // optional capability for stores that support password hash upgrade
  }

  default AuthUser register(RegisterRequest request, String passwordHash) {
    throw new UnsupportedOperationException("Registration is not supported for this store");
  }

  default boolean allowsMockFallback() {
    return true;
  }

  record AuthUser(
      Long id,
      String name,
      String username,
      String passwordHash,
      List<RoleCode> roles
  ) {}
}
