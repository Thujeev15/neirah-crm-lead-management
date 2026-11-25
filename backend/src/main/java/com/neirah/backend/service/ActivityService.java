package com.neirah.backend.service;

import com.neirah.backend.dto.ActivityRequest;
import com.neirah.backend.entity.*;
import com.neirah.backend.repository.ActivityRepository;
import com.neirah.backend.repository.LeadRepository;
import com.neirah.backend.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;

    public ActivityService(
            ActivityRepository activityRepository,
            LeadRepository leadRepository,
            UserRepository userRepository) {
        this.activityRepository = activityRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
    }

    private void checkAccess(Lead lead, User user) {
        if (user.getRole() != Role.MANAGER &&
                (lead.getOwner() == null ||
                        !lead.getOwner().getId().equals(user.getId()))) {
            throw new AccessDeniedException(
                    "You are not authorized to access this lead");
        }
    }

    @Transactional
    public ActivityResponseData createActivity(
            Long leadId, ActivityRequest request, String userEmail) {

        User actor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found"));

        checkAccess(lead, actor);

        Activity activity = new Activity();
        activity.setLead(lead);
        activity.setActor(actor);
        activity.setType(request.type());
        activity.setDescription(request.description().trim());

        return ActivityResponseData.from(activityRepository.save(activity));
    }

    @Transactional(readOnly = true)
    public List<ActivityResponseData> getTimeline(
            Long leadId, String userEmail) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found"));

        checkAccess(lead, user);

        return activityRepository.findByLeadIdOrderByCreatedAtDesc(leadId)
                .stream()
                .map(ActivityResponseData::from)
                .toList();
    }

    public record ActivityResponseData(
            Long id,
            Long leadId,
            String actorName,
            ActivityType type,
            String description,
            java.time.LocalDateTime createdAt) {

        public static ActivityResponseData from(Activity activity) {
            return new ActivityResponseData(
                    activity.getId(),
                    activity.getLead().getId(),
                    activity.getActor().getFullName(),
                    activity.getType(),
                    activity.getDescription(),
                    activity.getCreatedAt());
        }
    }
}
