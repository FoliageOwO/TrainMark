package com.trainmark.shared.dto;

import com.trainmark.shared.RoleCode;
import com.trainmark.shared.UserStatus;
import java.util.List;

public record UserSummary(
    Long id,
    Long organizationId,
    String username,
    String name,
    String studentNo,
    String teacherNo,
    String email,
    String phone,
    UserStatus status,
    List<RoleCode> roles
) {}
