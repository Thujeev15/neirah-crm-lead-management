package com.neirah.backend.controller;

import com.neirah.backend.dto.FollowUpRequest;
import com.neirah.backend.dto.FollowUpResponse;
import com.neirah.backend.service.FollowUpService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leads/{leadId}/follow-ups")
public class FollowUpController {

    private final FollowUpService followUpService;

    public FollowUpController(FollowUpService followUpService) {
        this.followUpService = followUpService;
    }

    @PostMapping
    public FollowUpResponse createFollowUp(
            @PathVariable Long leadId,
            @Valid @RequestBody FollowUpRequest request,
            Authentication authentication) {
        return followUpService.createFollowUp(
                leadId, request, authentication.getName());
    }

    @GetMapping
    public List<FollowUpResponse> getFollowUps(
            @PathVariable Long leadId,
            Authentication authentication) {
        return followUpService.getFollowUps(
                leadId, authentication.getName());
    }

    @PutMapping("/{followUpId}/complete")
    public FollowUpResponse completeFollowUp(
            @PathVariable Long leadId,
            @PathVariable Long followUpId,
            Authentication authentication) {
        return followUpService.completeFollowUp(
                leadId, followUpId, authentication.getName());
    }
}
