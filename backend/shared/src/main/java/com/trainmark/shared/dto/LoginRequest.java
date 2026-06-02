package com.trainmark.shared.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LoginRequest(
    @NotBlank
    @Size(min = 3, max = 32)
    @Pattern(regexp = "[A-Za-z0-9_-]{3,32}")
    String username,
    @NotBlank
    @Size(min = 6, max = 128)
    String password
) {}
