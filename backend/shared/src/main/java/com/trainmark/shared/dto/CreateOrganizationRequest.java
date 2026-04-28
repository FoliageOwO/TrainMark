package com.trainmark.shared.dto;

import com.trainmark.shared.OrganizationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateOrganizationRequest(
    Long parentId,
    @NotBlank String name,
    @NotNull OrganizationType type
) {}
