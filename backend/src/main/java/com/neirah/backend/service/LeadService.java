

package com.neirah.backend.service;

import com.neirah.backend.dto.LeadRequest;
import com.neirah.backend.entity.Lead;
import com.neirah.backend.entity.LeadStatus;
import com.neirah.backend.entity.Priority;
import com.neirah.backend.entity.Role;
import com.neirah.backend.entity.User;
import com.neirah.backend.repository.LeadRepository;
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
    private final UserRepository userRepository;

    public LeadService(
            LeadRepository leadRepository,
            UserRepository userRepository) {
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Lead createLead(LeadRequest request, String userEmail) {

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedPhone = normalizePhone(request.getPhone());

        if (normalizedEmail != null &&
                !leadRepository.findByEmailNormalized(normalizedEmail).isEmpty()) {
            throw new IllegalArgumentException(
                    "A lead with this email already exists");
        }

        if (normalizedPhone != null &&
                !leadRepository.findByPhoneNormalized(normalizedPhone).isEmpty()) {
            throw new IllegalArgumentException(
                    "A lead with this phone already exists");
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
