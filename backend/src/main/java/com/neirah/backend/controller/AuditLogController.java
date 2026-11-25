package com.neirah.backend.controller;

import com.neirah.backend.dto.AuditLogResponse;
import com.neirah.backend.service.AuditLogService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leads/{leadId}/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<AuditLogResponse> getLeadAuditHistory(
            @PathVariable Long leadId) {
        return auditLogService.getLeadAuditHistory(leadId);
    }
}
