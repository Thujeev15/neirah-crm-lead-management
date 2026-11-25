

package com.neirah.backend.service;

import com.neirah.backend.dto.LeadRequest;
import com.neirah.backend.dto.LeadResponse;
import com.neirah.backend.dto.DuplicateCheckResponse;
import com.neirah.backend.entity.Lead;
import com.neirah.backend.entity.AuditLog;
import com.neirah.backend.entity.AuditEventType;
import com.neirah.backend.entity.LeadStatus;
import com.neirah.backend.entity.Priority;
import com.neirah.backend.entity.Role;
import com.neirah.backend.entity.User;
import com.neirah.backend.repository.LeadRepository;
import com.neirah.backend.repository.AuditLogRepository;
import com.neirah.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class LeadService {

    private final LeadRepository leadRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public LeadService(
            LeadRepository leadRepository,
            UserRepository userRepository,
            AuditLogRepository auditLogRepository) {
        this.leadRepository = leadRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }


    @Transactional(readOnly = true)
    public DuplicateCheckResponse checkDuplicates(
            LeadRequest request, String userEmail) {

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedPhone = normalizePhone(request.getPhone());

        java.util.Map<Long, Lead> matches = new java.util.LinkedHashMap<>();

        if (normalizedEmail != null) {
            leadRepository.findByEmailNormalized(normalizedEmail)
                    .forEach(lead -> matches.put(lead.getId(), lead));
        }

        if (normalizedPhone != null) {
            leadRepository.findByPhoneNormalized(normalizedPhone)
                    .forEach(lead -> matches.put(lead.getId(), lead));
        }

        List<LeadResponse> visibleMatches = matches.values().stream()
                .filter(lead -> currentUser.getRole() == Role.MANAGER
                        || (lead.getOwner() != null
                        && lead.getOwner().getEmail().equals(userEmail)))
                .map(LeadResponse::from)
                .toList();

        return new DuplicateCheckResponse(
                !matches.isEmpty(), visibleMatches);
    }

    @Transactional
    public Lead createLead(LeadRequest request, String userEmail) {

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedPhone = normalizePhone(request.getPhone());

        boolean emailDuplicate = normalizedEmail != null
                && !leadRepository.findByEmailNormalized(normalizedEmail).isEmpty();

        boolean phoneDuplicate = normalizedPhone != null
                && !leadRepository.findByPhoneNormalized(normalizedPhone).isEmpty();

        if ((emailDuplicate || phoneDuplicate) && !request.isConfirmDuplicate()) {
            throw new IllegalArgumentException(
                    "A duplicate lead exists. Review the warning and confirm before creating.");
        }

        Lead lead = new Lead();
        lead.setName(request.getName().trim());
        lead.setCompany(request.getCompany());
        lead.setEmail(request.getEmail());
        lead.setEmailNormalized(normalizedEmail);
        lead.setPhone(request.getPhone());
        lead.setPhoneNormalized(normalizedPhone);
        lead.setSource(request.getSource());
        lead.setPriority(request.getPriority());
        lead.setStatus(LeadStatus.NEW);
        lead.setCreatedBy(currentUser);
        lead.setOwner(currentUser);

        return leadRepository.save(lead);
    }

    @Transactional(readOnly = true)
    public List<Lead> getAllLeads(String userEmail) {

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (currentUser.getRole() == Role.MANAGER) {
            return leadRepository.findAll();
        }

        return leadRepository.findByOwnerEmail(userEmail);
    }

    // Get one lead by ID with role-based access
    @Transactional(readOnly = true)
    public Lead getLeadById(Long leadId, String userEmail) {

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found"));

        if (currentUser.getRole() != Role.MANAGER &&
                (lead.getOwner() == null ||
                        !lead.getOwner().getEmail().equals(userEmail))) {
            throw new AccessDeniedException(
                    "You are not authorized to view this lead");
        }

        return lead;
    }

    @Transactional
    public Lead updateLead(Long leadId, LeadRequest request, String userEmail) {

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found"));

        if (currentUser.getRole() != Role.MANAGER &&
                (lead.getOwner() == null ||
                        !lead.getOwner().getEmail().equals(userEmail))) {
            throw new AccessDeniedException(
                    "You are not authorized to update this lead");
        }

        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedPhone = normalizePhone(request.getPhone());

        if (normalizedEmail != null &&
                leadRepository.findByEmailNormalized(normalizedEmail)
                        .stream()
                        .anyMatch(existing -> !existing.getId().equals(leadId))) {
            throw new IllegalArgumentException(
                    "Another lead with this email already exists");
        }

        if (normalizedPhone != null &&
                leadRepository.findByPhoneNormalized(normalizedPhone)
                        .stream()
                        .anyMatch(existing -> !existing.getId().equals(leadId))) {
            throw new IllegalArgumentException(
                    "Another lead with this phone already exists");
        }

        lead.setName(request.getName().trim());
        lead.setCompany(request.getCompany());
        lead.setEmail(request.getEmail());
        lead.setEmailNormalized(normalizedEmail);
        lead.setPhone(request.getPhone());
        lead.setPhoneNormalized(normalizedPhone);
        lead.setSource(request.getSource());
        lead.setPriority(request.getPriority());

        return leadRepository.save(lead);
    }


    @Transactional
    public Lead updateLeadStatus(
            Long leadId,
            LeadStatus newStatus,
            java.math.BigDecimal dealValue,
            String lossReason,
            String userEmail) {

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found"));

        if (currentUser.getRole() != Role.MANAGER &&
                (lead.getOwner() == null ||
                        !lead.getOwner().getEmail().equals(userEmail))) {
            throw new AccessDeniedException("You are not authorized to update this lead");
        }

        if (newStatus == null) {
            throw new IllegalArgumentException("New status is required");
        }

        if (lead.getStatus() == LeadStatus.WON ||
                lead.getStatus() == LeadStatus.LOST) {
            throw new IllegalArgumentException("Won or Lost leads cannot change status");
        }

        if (newStatus == LeadStatus.WON &&
                (dealValue == null || dealValue.compareTo(java.math.BigDecimal.ZERO) <= 0)) {
            throw new IllegalArgumentException("Positive deal value is required to mark a lead as Won");
        }

        if (newStatus == LeadStatus.LOST &&
                (lossReason == null || lossReason.isBlank())) {
            throw new IllegalArgumentException("Loss reason is required to mark a lead as Lost");
        }

        LeadStatus oldStatus = lead.getStatus();

        if (oldStatus == newStatus) {
            throw new IllegalArgumentException("Lead already has this status");
        }

        boolean validTransition = switch (oldStatus) {
            case NEW -> newStatus == LeadStatus.CONTACTED;
            case CONTACTED -> newStatus == LeadStatus.QUALIFIED;
            case QUALIFIED -> newStatus == LeadStatus.PROPOSAL_SENT
                    || newStatus == LeadStatus.LOST;
            case PROPOSAL_SENT -> newStatus == LeadStatus.WON
                    || newStatus == LeadStatus.LOST;
            case WON, LOST -> false;
        };

        if (!validTransition) {
            throw new IllegalArgumentException(
                    "Invalid pipeline transition: " + oldStatus + " to " + newStatus);
        }

        lead.setStatus(newStatus);

        if (newStatus == LeadStatus.WON) {
            lead.setDealValue(dealValue);
            lead.setLossReason(null);
        }

        if (newStatus == LeadStatus.LOST) {
            lead.setLossReason(lossReason.trim());
            lead.setDealValue(null);
        }

        AuditLog auditLog = new AuditLog();
        auditLog.setLead(lead);
        auditLog.setActor(currentUser);
        auditLog.setEventType(AuditEventType.STATUS_CHANGED);
        auditLog.setOldValue(oldStatus.name());
        auditLog.setNewValue(newStatus.name());

        auditLogRepository.save(auditLog);

        return leadRepository.save(lead);
    }

    @Transactional
    public Lead assignLead(Long leadId, String newOwnerEmail, String managerEmail) {

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Manager not found"));

        if (manager.getRole() != Role.MANAGER) {
            throw new AccessDeniedException(
                    "Only managers can assign leads");
        }

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found"));

        User newOwner = userRepository.findByEmail(newOwnerEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new IllegalArgumentException("Sales representative not found"));

        if (newOwner.getRole() != Role.SALES_REP) {
            throw new IllegalArgumentException(
                    "Lead can only be assigned to a sales representative");
        }

        User oldOwner = lead.getOwner();

        if (oldOwner != null && oldOwner.getId().equals(newOwner.getId())) {
            return lead;
        }

        AuditLog auditLog = new AuditLog();
        auditLog.setLead(lead);
        auditLog.setActor(manager);
        auditLog.setEventType(AuditEventType.OWNER_CHANGED);
        auditLog.setOldValue(oldOwner == null ? null : oldOwner.getEmail());
        auditLog.setNewValue(newOwner.getEmail());

        lead.setOwner(newOwner);

        auditLogRepository.save(auditLog);

        return leadRepository.save(lead);
    }

    @Transactional(readOnly = true)
    public Page<Lead> searchLeads(
            String userEmail,
            String search,
            LeadStatus status,
            Priority priority,
            String ownerEmail,
            Pageable pageable) {

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String effectiveOwnerEmail;

        if (currentUser.getRole() == Role.MANAGER) {
            effectiveOwnerEmail = ownerEmail;
        } else {
            effectiveOwnerEmail = userEmail;
        }

        String searchTerm = (search == null || search.isBlank())
                ? null : search.trim();

        return leadRepository.searchLeads(
                searchTerm,
                status,
                priority,
                effectiveOwnerEmail,
                pageable
        );
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }

        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }

        String normalized = phone.replaceAll("[^0-9]", "");

        return normalized.isBlank() ? null : normalized;
    }
}
