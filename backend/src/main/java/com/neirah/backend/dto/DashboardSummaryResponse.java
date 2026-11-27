package com.neirah.backend.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record DashboardSummaryResponse(
        long totalLeads,
        long activeLeads,
        long wonLeads,
        long lostLeads,
        long customers,
        double conversionRate,
        double winRate,
        BigDecimal wonDealValue,
        long overdueFollowUps,
        long upcomingFollowUps,
        Map<String, Long> countsByStage,
        List<OwnerCount> leadsByOwner
) {
    public record OwnerCount(String ownerName, String ownerEmail, long leads) {
    }
}
