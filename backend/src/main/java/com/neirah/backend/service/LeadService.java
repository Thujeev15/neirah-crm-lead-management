

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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class LeadService {

    private static final Logger log = LoggerFactory.getLogger(LeadService.class);

    private final LeadRepository leadRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final com.neirah.backend.repository.FollowUpRepository followUpRepository;

    public LeadService(
            LeadRepository leadRepository,
            UserRepository userRepository,
            AuditLogRepository auditLogRepository,
            com.neirah.backend.repository.FollowUpRepository followUpRepository) {
        this.leadRepository = leadRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.followUpRepository = followUpRepository;
    }


    @Transactional(readOnly = true)
    public DuplicateCheckResponse checkDuplicates(
            LeadRequest request, String userEmail) {

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));

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
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));

        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedPhone = normalizePhone(request.getPhone());

        boolean emailDuplicate = normalizedEmail != null
                && !leadRepository.findByEmailNormalized(normalizedEmail).isEmpty();

        boolean phoneDuplicate = normalizedPhone != null
                && !leadRepository.findByPhoneNormalized(normalizedPhone).isEmpty();

        if ((emailDuplicate || phoneDuplicate) && !request.isConfirmDuplicate()) {
            log.info("Lead creation by {} blocked pending duplicate confirmation (email match: {}, phone match: {})",
                    userEmail, emailDuplicate, phoneDuplicate);
            throw new com.neirah.backend.exception.DuplicateResourceException(
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

        Lead saved = leadRepository.save(lead);
        log.info("Lead {} created by {}{}", saved.getId(), userEmail,
                (emailDuplicate || phoneDuplicate) ? " (duplicate warning acknowledged)" : "");
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Lead> getAllLeads(String userEmail) {

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));

        if (currentUser.getRole() == Role.MANAGER) {
            return leadRepository.findAll();
        }

        return leadRepository.findByOwnerEmail(userEmail);
    }

    // Get one lead by ID with role-based access
    @Transactional(readOnly = true)
    public Lead getLeadById(Long leadId, String userEmail) {

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Lead not found"));

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
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Lead not found"));

        if (currentUser.getRole() != Role.MANAGER &&
                (lead.getOwner() == null ||
                        !lead.getOwner().getEmail().equals(userEmail))) {
            throw new AccessDeniedException(
                    "You are not authorized to update this lead");
        }

        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedPhone = normalizePhone(request.getPhone());

        // Only re-check duplicates when the contact value actually changes, so a lead that
        // was deliberately created as a confirmed duplicate can still be edited.
        boolean emailChanged = normalizedEmail != null
                && !normalizedEmail.equals(lead.getEmailNormalized());
        boolean phoneChanged = normalizedPhone != null
                && !normalizedPhone.equals(lead.getPhoneNormalized());

        if (!request.isConfirmDuplicate()) {
            if (emailChanged && leadRepository.findByEmailNormalized(normalizedEmail)
                    .stream().anyMatch(existing -> !existing.getId().equals(leadId))) {
                throw new com.neirah.backend.exception.DuplicateResourceException(
                        "Another lead with this email already exists. Confirm to save anyway.");
            }

            if (phoneChanged && leadRepository.findByPhoneNormalized(normalizedPhone)
                    .stream().anyMatch(existing -> !existing.getId().equals(leadId))) {
                throw new com.neirah.backend.exception.DuplicateResourceException(
                        "Another lead with this phone already exists. Confirm to save anyway.");
            }
        }

        lead.setName(request.getName().trim());
        lead.setCompany(request.getCompany());
        lead.setEmail(request.getEmail());
        lead.setEmailNormalized(normalizedEmail);
        lead.setPhone(request.getPhone());
        lead.setPhoneNormalized(normalizedPhone);
        lead.setSource(request.getSource());
        lead.setPriority(request.getPriority());

        Lead saved = leadRepository.save(lead);
        log.info("Lead {} details updated by {}", leadId, userEmail);
        return saved;
    }


    @Transactional
    public Lead updateLeadStatus(
            Long leadId,
            LeadStatus newStatus,
            java.math.BigDecimal dealValue,
            String lossReason,
            String userEmail) {

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Lead not found"));

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
            // Any open lead may be lost (e.g. spam or unresponsive); WON only after a proposal.
            case NEW -> newStatus == LeadStatus.CONTACTED
                    || newStatus == LeadStatus.LOST;
            case CONTACTED -> newStatus == LeadStatus.QUALIFIED
                    || newStatus == LeadStatus.LOST;
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

        Lead saved = leadRepository.save(lead);
        log.info("Lead {} status changed {} -> {} by {}", leadId, oldStatus, newStatus, userEmail);
        return saved;
    }

    @Transactional
    public Lead assignLead(Long leadId, String newOwnerEmail, String managerEmail) {

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Manager not found"));

        if (manager.getRole() != Role.MANAGER) {
            throw new AccessDeniedException(
                    "Only managers can assign leads");
        }

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Lead not found"));

        User newOwner = userRepository.findByEmail(newOwnerEmail.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Sales representative not found"));

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

        Lead saved = leadRepository.save(lead);

        // Open follow-ups move with the lead so the new owner can act on them.
        // Completed follow-ups keep their original assignee as history.
        int moved = followUpRepository.reassignOpenFollowUps(leadId, newOwner);

        log.info("Lead {} reassigned from {} to {} by {} ({} open follow-ups moved)", leadId,
                oldOwner == null ? "unassigned" : oldOwner.getEmail(), newOwner.getEmail(),
                managerEmail, moved);
        return saved;
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
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));

        String effectiveOwnerEmail;

        if (currentUser.getRole() == Role.MANAGER) {
            // Emails are stored lower-case, so match the filter the same way.
            effectiveOwnerEmail = (ownerEmail == null || ownerEmail.isBlank())
                    ? null : ownerEmail.trim().toLowerCase(Locale.ROOT);
        } else {
            effectiveOwnerEmail = userEmail;
        }

        String searchTerm = (search == null || search.isBlank())
                ? null : search.trim();

        // Allow "0771000003" to find "077-100-0003". Require 3+ digits so a single
        // digit in a name search does not match every phone number.
        String searchDigits = searchTerm == null ? null : normalizePhone(searchTerm);
        if (searchDigits != null && searchDigits.length() < 3) {
            searchDigits = null;
        }

        return leadRepository.searchLeads(
                searchTerm,
                searchDigits,
                status,
                priority,
                effectiveOwnerEmail,
                pageable
        );
    }

    private String normalizeEmail(String email) {
        return com.neirah.backend.util.ContactNormalizer.email(email);
    }

    private String normalizePhone(String phone) {
        return com.neirah.backend.util.ContactNormalizer.phone(phone);
    }
}
