package com.neirah.backend.service;

import com.neirah.backend.dto.FollowUpRequest;
import com.neirah.backend.dto.FollowUpResponse;
import com.neirah.backend.entity.*;
import com.neirah.backend.repository.FollowUpRepository;
import com.neirah.backend.repository.LeadRepository;
import com.neirah.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FollowUpService {

    private final FollowUpRepository followUpRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;

    public FollowUpService(FollowUpRepository followUpRepository,
                           LeadRepository leadRepository,
                           UserRepository userRepository) {
        this.followUpRepository = followUpRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
    }

    private void checkLeadAccess(Lead lead, User user) {
        if (user.getRole() != Role.MANAGER &&
                (lead.getOwner() == null ||
                 !lead.getOwner().getId().equals(user.getId()))) {
            throw new AccessDeniedException("You cannot manage follow-ups for this lead");
        }
    }

    @Transactional
    public FollowUpResponse createFollowUp(Long leadId, FollowUpRequest request,
                                           String userEmail) {
        User actor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));

        checkLeadAccess(lead, actor);

        User assignedTo = lead.getOwner();

        if (request.assignedToId() != null) {
            if (actor.getRole() != Role.MANAGER) {
                throw new AccessDeniedException("Only managers can assign follow-ups to other users");
            }

            assignedTo = userRepository.findById(request.assignedToId())
                    .orElseThrow(() -> new EntityNotFoundException("Assigned user not found"));

            if (assignedTo.getRole() != Role.SALES_REP) {
                throw new IllegalArgumentException("Follow-ups can only be assigned to sales representatives");
            }
        }

        FollowUp followUp = new FollowUp();
        followUp.setLead(lead);
        followUp.setCreatedBy(actor);
        followUp.setAssignedTo(assignedTo);
        followUp.setType(request.type());
        followUp.setTitle(request.title().trim());
        followUp.setDescription(request.description() == null
                ? null : request.description().trim());
        followUp.setDueAt(request.dueAt());

        return FollowUpResponse.from(followUpRepository.save(followUp));
    }

    @Transactional(readOnly = true)
    public List<FollowUpResponse> getFollowUps(Long leadId, String userEmail) {
        User actor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));

        checkLeadAccess(lead, actor);

        return followUpRepository.findByLeadIdOrderByDueAtAsc(leadId)
                .stream()
                .map(FollowUpResponse::from)
                .toList();
    }

    @Transactional
    public FollowUpResponse completeFollowUp(Long leadId, Long followUpId,
                                              String userEmail) {
        User actor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));

        checkLeadAccess(lead, actor);

        FollowUp followUp = followUpRepository.findById(followUpId)
                .orElseThrow(() -> new EntityNotFoundException("Follow-up not found"));

        if (!followUp.getLead().getId().equals(leadId)) {
            throw new IllegalArgumentException("Follow-up does not belong to this lead");
        }

        if (followUp.getCompletedAt() == null) {
            followUp.setCompletedAt(LocalDateTime.now());
        }

        return FollowUpResponse.from(followUpRepository.save(followUp));
    }
}
