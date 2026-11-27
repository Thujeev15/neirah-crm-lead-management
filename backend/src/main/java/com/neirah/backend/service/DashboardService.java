package com.neirah.backend.service;

import com.neirah.backend.dto.DashboardSummaryResponse;
import com.neirah.backend.dto.DashboardSummaryResponse.OwnerCount;
import com.neirah.backend.entity.LeadStatus;
import com.neirah.backend.entity.Role;
import com.neirah.backend.entity.User;
import com.neirah.backend.repository.CustomerRepository;
import com.neirah.backend.repository.FollowUpRepository;
import com.neirah.backend.repository.LeadRepository;
import com.neirah.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Builds dashboard metrics on the server. Managers see every lead; sales
 * representatives see metrics for the leads they currently own.
 */
@Service
public class DashboardService {

    private final LeadRepository leadRepository;
    private final FollowUpRepository followUpRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public DashboardService(LeadRepository leadRepository,
                            FollowUpRepository followUpRepository,
                            CustomerRepository customerRepository,
                            UserRepository userRepository) {
        this.leadRepository = leadRepository;
        this.followUpRepository = followUpRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
    }

    private static double percentage(long part, long whole) {
        return whole == 0 ? 0.0 : Math.round(part * 1000.0 / whole) / 10.0;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Long ownerId = user.getRole() == Role.MANAGER ? null : user.getId();
        LocalDateTime now = LocalDateTime.now();

        Map<String, Long> countsByStage = new LinkedHashMap<>();
        for (LeadStatus status : LeadStatus.values()) {
            countsByStage.put(status.name(), 0L);
        }
        for (Object[] row : leadRepository.countByStatus(ownerId)) {
            countsByStage.put(((LeadStatus) row[0]).name(), (Long) row[1]);
        }

        long total = countsByStage.values().stream().mapToLong(Long::longValue).sum();
        long won = countsByStage.get(LeadStatus.WON.name());
        long lost = countsByStage.get(LeadStatus.LOST.name());
        long active = total - won - lost;

        // Conversion rate = Won / all leads. Win rate = Won / closed (Won + Lost).
        // Both are percentages rounded to one decimal place.
        double conversionRate = percentage(won, total);
        double winRate = percentage(won, won + lost);

        List<OwnerCount> byOwner = leadRepository.countByOwner(ownerId).stream()
                .map(row -> new OwnerCount(
                        row[0] == null ? "Unassigned" : (String) row[0],
                        (String) row[1],
                        (Long) row[2]))
                .toList();

        BigDecimal wonValue = leadRepository.sumWonDealValue(ownerId);

        return new DashboardSummaryResponse(
                total,
                active,
                won,
                lost,
                customerRepository.countVisible(ownerId),
                conversionRate,
                winRate,
                wonValue == null ? BigDecimal.ZERO : wonValue,
                followUpRepository.countOverdue(ownerId, now),
                followUpRepository.countUpcoming(ownerId, now),
                countsByStage,
                byOwner);
    }
}
