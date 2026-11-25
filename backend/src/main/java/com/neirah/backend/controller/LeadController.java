

package com.neirah.backend.controller;

import com.neirah.backend.dto.LeadRequest;
import com.neirah.backend.dto.LeadResponse;
import com.neirah.backend.dto.DuplicateCheckResponse;
import com.neirah.backend.entity.Lead;
import com.neirah.backend.entity.LeadStatus;
import com.neirah.backend.entity.Priority;
import com.neirah.backend.service.LeadService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/leads")
public class LeadController {

    private final LeadService leadService;

    public LeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    @GetMapping
    public List<LeadResponse> getAllLeads(Authentication authentication) {
        return leadService.getAllLeads(authentication.getName())
                .stream()
                .map(LeadResponse::from)
                .toList();
    }

    @GetMapping("/search")
    public Map<String, Object> searchLeads(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LeadStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) String ownerEmail,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException(
                    "Page must be non-negative and size must be between 1 and 100"
            );
        }

        Pageable pageable = PageRequest.of(page, size);

        Page<Lead> results = leadService.searchLeads(
                authentication.getName(),
                search,
                status,
                priority,
                ownerEmail,
                pageable
        );

        List<LeadResponse> leads = results.getContent()
                .stream()
                .map(LeadResponse::from)
                .toList();

        return Map.of(
                "leads", leads,
                "currentPage", results.getNumber(),
                "totalItems", results.getTotalElements(),
                "totalPages", results.getTotalPages()
        );
    }

    @GetMapping("/{id}")
    public LeadResponse getLeadById(
            @PathVariable Long id,
            Authentication authentication) {

        Lead lead = leadService.getLeadById(
                id,
                authentication.getName()
        );

        return LeadResponse.from(lead);
    }

    @PostMapping("/check-duplicates")
    public DuplicateCheckResponse checkDuplicates(
            @Valid @RequestBody LeadRequest request,
            Authentication authentication) {

        return leadService.checkDuplicates(
                request,
                authentication.getName()
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createLead(
            @Valid @RequestBody LeadRequest request,
            Authentication authentication) {

        Lead lead = leadService.createLead(
                request,
                authentication.getName()
        );

        return Map.of(
                "message", "Lead created successfully",
                "leadId", lead.getId(),
                "name", lead.getName(),
                "status", lead.getStatus().name()
        );
    }

    @PutMapping("/{id}")
    public LeadResponse updateLead(
            @PathVariable Long id,
            @Valid @RequestBody LeadRequest request,
            Authentication authentication) {

        Lead updatedLead = leadService.updateLead(
                id,
                request,
                authentication.getName()
        );

        return LeadResponse.from(updatedLead);
    }

    @PutMapping("/{id}/assign")
    public LeadResponse assignLead(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        String ownerEmail = request.get("ownerEmail");

        if (ownerEmail == null || ownerEmail.isBlank()) {
            throw new IllegalArgumentException(
                    "ownerEmail is required");
        }

        Lead assignedLead = leadService.assignLead(
                id,
                ownerEmail,
                authentication.getName()
        );

        return LeadResponse.from(assignedLead);
    }
}
