package com.neirah.backend.dto;

import com.neirah.backend.entity.FollowUpType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record FollowUpRequest(
        @NotNull(message = "Follow-up type is required")
        FollowUpType type,

        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title cannot exceed 150 characters")
        String title,

        @Size(max = 1000, message = "Description cannot exceed 1000 characters")
        String description,

        @NotNull(message = "Due date and time are required")
        LocalDateTime dueAt,

        Long assignedToId
) {
}
