package com.trainmark.shared.dto;

import com.trainmark.shared.OrganizationType;

public record OrganizationSummary(
    Long id,
    Long parentId,
    String name,
    OrganizationType type
) {}
