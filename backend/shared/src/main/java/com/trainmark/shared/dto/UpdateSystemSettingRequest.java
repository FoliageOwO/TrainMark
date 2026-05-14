package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateSystemSettingRequest(
    @NotBlank String value
) {}
