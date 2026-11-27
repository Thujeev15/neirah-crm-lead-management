package com.neirah.backend.controller;

import com.neirah.backend.dto.FollowUpResponse;
import com.neirah.backend.service.FollowUpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/follow-ups")
@Tag(name = "Follow-ups", description = "Cross-lead follow-up schedule")
public class FollowUpListController {

    private final FollowUpService followUpService;

    public FollowUpListController(FollowUpService followUpService) {
        this.followUpService = followUpService;
    }

    @GetMapping
    @Operation(summary = "List follow-ups across all visible leads. "
            + "status = ALL | UPCOMING | OVERDUE | COMPLETED (default ALL).")
    public List<FollowUpResponse> getFollowUps(
            @RequestParam(defaultValue = "ALL") FollowUpService.FollowUpFilter status,
            Authentication authentication) {
        return followUpService.getVisibleFollowUps(authentication.getName(), status);
    }
}
