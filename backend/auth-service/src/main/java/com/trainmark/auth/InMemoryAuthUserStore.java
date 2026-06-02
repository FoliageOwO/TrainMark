package com.trainmark.auth;

import com.trainmark.shared.RoleCode;
import com.trainmark.shared.dto.RegisterRequest;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.auth.store", havingValue = "memory", matchIfMissing = true)
public class InMemoryAuthUserStore implements AuthUserStore {
  private final AtomicLong ids = new AtomicLong(1000);
  private final Map<String, AuthUser> users = new ConcurrentHashMap<>();

  public InMemoryAuthUserStore() {
    seed("teacher", "王老师", "plain:trainmark", RoleCode.TEACHER);
    seed("2024010101", "张三", "plain:trainmark", RoleCode.STUDENT);
    seed("owner", "刘主任", "plain:trainmark", RoleCode.COURSE_OWNER);
    seed("supervisor", "陈督导", "plain:trainmark", RoleCode.SUPERVISOR);
    seed("admin", "系统管理员", "plain:trainmark", RoleCode.ADMIN);
  }

  @Override
  public Optional<AuthUser> findByLogin(String username) {
    return Optional.ofNullable(users.get(username.toLowerCase()));
  }

  @Override
  public AuthUser register(RegisterRequest request, String passwordHash) {
    var normalized = request.username().trim().toLowerCase();
    if (users.containsKey(normalized)) {
      throw new IllegalArgumentException("Username already exists");
    }
    var user = new AuthUser(
        ids.incrementAndGet(),
        request.name().trim(),
        normalized,
        passwordHash,
        List.of(RoleCode.STUDENT)
    );
    users.put(normalized, user);
    return user;
  }

  @Override
  public boolean allowsMockFallback() {
    return false;
  }

  private void seed(String username, String name, String passwordHash, RoleCode role) {
    var id = ids.incrementAndGet();
    users.put(username, new AuthUser(id, name, username, passwordHash, List.of(role)));
  }
}
