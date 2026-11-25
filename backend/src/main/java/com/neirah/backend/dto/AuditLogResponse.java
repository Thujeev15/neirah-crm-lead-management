package com.neirah.backend.dto;

import com.neirah.backend.entity.AuditLog;
import com.neirah.backend.entity.AuditEventType;
import java.time.LocalDateTime;

public record AuditLogResponse(
    Long id,
    Long leadId,
    String actorName,
    AuditEventType eventType,
    String oldValue,
    String newValue,
    LocalDateTime occurredAt
) {
    public static AuditLogResponse from(AuditLog auditLog) {
        return new AuditLogResponse(
            auditLog.getId(),
            auditLog.getLead().getId(),
            auditLog.getActor().getFullName(),
            auditLog.getEventType(),
            auditLog.getOldValue(),
            auditLog.getNewValue(),
            auditLog.getOccurredAt()
        );
    }
}
