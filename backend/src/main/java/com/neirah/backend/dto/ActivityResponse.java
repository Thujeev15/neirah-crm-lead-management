package com.neirah.backend.dto;

import com.neirah.backend.entity.Activity;
import com.neirah.backend.entity.ActivityType;
import java.time.LocalDateTime;

public record ActivityResponse(
        Long id,
        Long leadId,
        String actorName,
        ActivityType type,
        String description,
        LocalDateTime createdAt
) {
    public static ActivityResponse from(Activity activity) {
        return new ActivityResponse(
                activity.getId(),
                activity.getLead().getId(),
                activity.getActor().getFullName(),
                activity.getType(),
                activity.getDescription(),
                activity.getCreatedAt()
        );
    }
}
