package com.neirah.backend.dto;

import com.neirah.backend.entity.ActivityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ActivityRequest(
        @NotNull(message = "Activity type is required")
        ActivityType type,

        @NotBlank(message = "Description is required")
        @Size(max = 2000, message = "Description cannot exceed 2000 characters")
        String description
) {
}
