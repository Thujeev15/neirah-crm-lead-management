package com.neirah.backend.service;

import com.neirah.backend.dto.FollowUpRequest;
import com.neirah.backend.dto.FollowUpResponse;
import com.neirah.backend.entity.*;
import com.neirah.backend.repository.FollowUpRepository;
import com.neirah.backend.repository.LeadRepository;
import com.neirah.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FollowUpService {

    private static final Logger log = LoggerFactory.getLogger(FollowUpService.class);

    public enum FollowUpFilter { ALL, UPCOMING, OVERDUE, COMPLETED }

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

        // Won and Lost are final stages, so no new work can be scheduled on them.
        // Existing open follow-ups can still be marked complete (see completeFollowUp).
        if (lead.getStatus() == LeadStatus.WON || lead.getStatus() == LeadStatus.LOST) {
            log.info("Follow-up creation rejected on closed lead {} ({}) for {}",
                    leadId, lead.getStatus(), userEmail);
            throw new IllegalArgumentException(
                    "Follow-ups cannot be scheduled on Won or Lost leads");
        }

        // A follow-up always belongs to the lead owner. Visibility and completion are based on
        // lead ownership (business rule 3), so assigning it to anyone else would create a task
        // that person can neither see nor complete. To hand work over, reassign the lead.
        User assignedTo = lead.getOwner();

        if (request.assignedToId() != null
                && (assignedTo == null || !request.assignedToId().equals(assignedTo.getId()))) {
            throw new IllegalArgumentException(
                    "Follow-ups are assigned to the lead owner. Reassign the lead to change who handles it.");
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

        FollowUp saved = followUpRepository.save(followUp);
        log.info("Follow-up {} ({}) created on lead {} by {} due {}",
                saved.getId(), saved.getType(), leadId, userEmail, saved.getDueAt());
        return FollowUpResponse.from(saved);
    }

    /**
     * Follow-ups across every lead the user can see. Overdue/upcoming is derived
     * from dueAt and completedAt at request time, never from a stored label.
     */
    @Transactional(readOnly = true)
    public List<FollowUpResponse> getVisibleFollowUps(String userEmail, FollowUpFilter filter) {
        User actor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Long ownerId = actor.getRole() == Role.MANAGER ? null : actor.getId();
        LocalDateTime now = LocalDateTime.now();

        return followUpRepository.findVisible(ownerId).stream()
                .filter(f -> switch (filter == null ? FollowUpFilter.ALL : filter) {
                    case ALL -> true;
                    case COMPLETED -> f.getCompletedAt() != null;
                    case OVERDUE -> f.getCompletedAt() == null && f.getDueAt().isBefore(now);
                    case UPCOMING -> f.getCompletedAt() == null && !f.getDueAt().isBefore(now);
                })
                .map(FollowUpResponse::from)
                .toList();
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
            log.info("Follow-up {} on lead {} marked complete by {}", followUpId, leadId, userEmail);
        }

        return FollowUpResponse.from(followUpRepository.save(followUp));
    }
}
