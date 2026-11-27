package com.neirah.backend.service;

import com.neirah.backend.dto.AuditLogResponse;
import com.neirah.backend.entity.Lead;
import com.neirah.backend.entity.User;
import com.neirah.backend.repository.AuditLogRepository;
import com.neirah.backend.repository.LeadRepository;
import com.neirah.backend.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;

    public AuditLogService(
            AuditLogRepository auditLogRepository,
            LeadRepository leadRepository,
            UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLeadAuditHistory(Long leadId) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Lead not found"));

        if (!"MANAGER".equals(currentUser.getRole().name())
                && (lead.getOwner() == null
                || !lead.getOwner().getId().equals(currentUser.getId()))) {
            throw new AccessDeniedException("You cannot view this lead's audit history");
        }

        return auditLogRepository.findByLeadIdOrderByOccurredAtAsc(leadId)
                .stream()
                .map(AuditLogResponse::from)
                .toList();
    }
}
