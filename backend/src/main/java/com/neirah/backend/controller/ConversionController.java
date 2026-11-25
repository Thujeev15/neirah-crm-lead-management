package com.neirah.backend.controller;

import com.neirah.backend.dto.ConversionResponse;
import com.neirah.backend.service.ConversionService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/leads")
public class ConversionController {

    private final ConversionService conversionService;

    public ConversionController(ConversionService conversionService) {
        this.conversionService = conversionService;
    }

    @PostMapping("/{leadId}/convert")
    public ConversionResponse convertLead(
            @PathVariable Long leadId,
            Authentication authentication) {
        return conversionService.convertLead(leadId, authentication.getName());
    }
}
