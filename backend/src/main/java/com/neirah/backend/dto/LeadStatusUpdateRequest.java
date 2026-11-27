package com.neirah.backend.dto;

import com.neirah.backend.entity.LeadStatus;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record LeadStatusUpdateRequest(
        @NotNull(message = "Status is required") LeadStatus status,
        @jakarta.validation.constraints.Digits(integer = 10, fraction = 2,
                message = "Deal value can have at most 10 digits and 2 decimal places")
        BigDecimal dealValue,

        @jakarta.validation.constraints.Size(max = 500, message = "Loss reason cannot exceed 500 characters")
        String lossReason
) {
}
