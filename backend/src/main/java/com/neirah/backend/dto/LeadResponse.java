package com.neirah.backend.dto;

import com.neirah.backend.entity.Lead;
import java.time.LocalDateTime;

public record LeadResponse(
        Long id,
        String name,
        String company,
        String email,
        String phone,
        String source,
        String priority,
        String status,
        String ownerName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static LeadResponse from(Lead lead) {
        return new LeadResponse(
                lead.getId(),
                lead.getName(),
                lead.getCompany(),
                lead.getEmail(),
                lead.getPhone(),
                lead.getSource(),
                lead.getPriority().name(),
                lead.getStatus().name(),
                lead.getOwner() == null ? null : lead.getOwner().getFullName(),
                lead.getCreatedAt(),
                lead.getUpdatedAt()
        );
    }
}
