package com.trainmark.shared.dto;

import com.trainmark.shared.RoleCode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreateUserRequest(
    Long organizationId,
    @NotBlank String username,
    @NotBlank String name,
    String studentNo,
    String teacherNo,
    String email,
    String phone,
    @NotEmpty List<RoleCode> roles
) {}
