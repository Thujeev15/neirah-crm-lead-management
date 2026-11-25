package com.neirah.backend.dto;

import com.neirah.backend.entity.LeadStatus;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record LeadStatusUpdateRequest(
        @NotNull(message = "Status is required") LeadStatus status,
        BigDecimal dealValue,
        String lossReason
) {
}
