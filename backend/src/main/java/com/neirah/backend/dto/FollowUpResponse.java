package com.neirah.backend.dto;

import com.neirah.backend.entity.FollowUp;
import com.neirah.backend.entity.FollowUpType;
import java.time.LocalDateTime;

public record FollowUpResponse(
        Long id,
        Long leadId,
        String leadName,
        String title,
        String description,
        FollowUpType type,
        LocalDateTime dueAt,
        LocalDateTime completedAt,
        String assignedToName,
        boolean completed,
        boolean overdue,
        LocalDateTime createdAt
) {
    public static FollowUpResponse from(FollowUp followUp) {
        return new FollowUpResponse(
                followUp.getId(),
                followUp.getLead().getId(),
                followUp.getLead().getName(),
                followUp.getTitle(),
                followUp.getDescription(),
                followUp.getType(),
                followUp.getDueAt(),
                followUp.getCompletedAt(),
                followUp.getAssignedTo() == null
                        ? null : followUp.getAssignedTo().getFullName(),
                followUp.getCompletedAt() != null,
                followUp.getCompletedAt() == null
                        && followUp.getDueAt().isBefore(LocalDateTime.now()),
                followUp.getCreatedAt()
        );
    }
}
