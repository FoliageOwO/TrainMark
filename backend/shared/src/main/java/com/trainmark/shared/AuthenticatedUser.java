package com.trainmark.shared;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

public record AuthenticatedUser(Long userId, String username, Set<RoleCode> roles) {
  public static final String USER_ID_HEADER = "X-TrainMark-User-Id";
  public static final String USERNAME_HEADER = "X-TrainMark-Username";
  public static final String ROLES_HEADER = "X-TrainMark-Roles";

  public static AuthenticatedUser fromHeaders(String userId, String username, String roles) {
    return new AuthenticatedUser(parseUserId(userId), username, parseRoles(roles));
  }

  public boolean isAuthenticated() {
    return userId != null || !roles.isEmpty();
  }

  public boolean hasRole(RoleCode role) {
    return roles.contains(role);
  }

  public boolean isStudent() {
    return hasRole(RoleCode.STUDENT);
  }

  public boolean isStaff() {
    return hasRole(RoleCode.TEACHER)
        || hasRole(RoleCode.COURSE_OWNER)
        || hasRole(RoleCode.SUPERVISOR)
        || hasRole(RoleCode.ADMIN);
  }

  public void requireStudentOwner(Long studentId) {
    if (!isAuthenticated() || !isStudent()) {
      return;
    }
    if (userId == null || studentId == null || !userId.equals(studentId)) {
      throw new TrainMarkAccessDeniedException("Students can only access their own data");
    }
  }

  public void requireStaff() {
    if (!isAuthenticated()) {
      return;
    }
    if (!isStaff()) {
      throw new TrainMarkAccessDeniedException("Access is denied");
    }
  }

  private static Long parseUserId(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    try {
      return Long.valueOf(value.trim());
    } catch (NumberFormatException error) {
      throw new TrainMarkAccessDeniedException("Authenticated user id is invalid");
    }
  }

  private static Set<RoleCode> parseRoles(String value) {
    if (value == null || value.isBlank()) {
      return Set.of();
    }
    return Arrays.stream(value.split(","))
        .map(String::trim)
        .filter(item -> !item.isBlank())
        .map(AuthenticatedUser::parseRole)
        .collect(Collectors.toCollection(() -> EnumSet.noneOf(RoleCode.class)));
  }

  private static RoleCode parseRole(String value) {
    try {
      return RoleCode.valueOf(value);
    } catch (IllegalArgumentException error) {
      throw new TrainMarkAccessDeniedException("Authenticated user role is invalid");
    }
  }
}
