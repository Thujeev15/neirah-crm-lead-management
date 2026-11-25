package com.neirah.backend.repository;

import com.neirah.backend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByLeadIdOrderByOccurredAtAsc(Long leadId);
}
