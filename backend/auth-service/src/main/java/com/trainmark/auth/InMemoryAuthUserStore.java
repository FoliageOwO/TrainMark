package com.trainmark.auth;

import java.util.Optional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.auth.store", havingValue = "memory", matchIfMissing = true)
public class InMemoryAuthUserStore implements AuthUserStore {
  @Override
  public Optional<AuthUser> findByLogin(String username) {
    return Optional.empty();
  }
}
