package com.neirah.backend.controller;

import com.neirah.backend.dto.ActivityRequest;
import com.neirah.backend.service.ActivityService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leads/{leadId}/activities")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @PostMapping
    public ActivityService.ActivityResponseData createActivity(
            @PathVariable Long leadId,
            @Valid @RequestBody ActivityRequest request,
            Authentication authentication) {

        return activityService.createActivity(
                leadId, request, authentication.getName());
    }

    @GetMapping
    public List<ActivityService.ActivityResponseData> getTimeline(
            @PathVariable Long leadId,
            Authentication authentication) {

        return activityService.getTimeline(
                leadId, authentication.getName());
    }
}
