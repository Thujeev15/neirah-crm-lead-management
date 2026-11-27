package com.neirah.backend.service;

import com.neirah.backend.dto.FollowUpRequest;
import com.neirah.backend.dto.FollowUpResponse;
import com.neirah.backend.entity.*;
import com.neirah.backend.repository.FollowUpRepository;
import com.neirah.backend.repository.LeadRepository;
import com.neirah.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Business rule 5: overdue is derived from due date/time and completion status. */
@ExtendWith(MockitoExtension.class)
class FollowUpServiceTest {

    @Mock private FollowUpRepository followUpRepository;
    @Mock private LeadRepository leadRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private FollowUpService followUpService;

    private User rep;
    private Lead lead;

    @BeforeEach
    void setUp() {
        rep = new User();
        rep.setId(1L);
        rep.setEmail("rep@example.com");
        rep.setFullName("Rep One");
        rep.setRole(Role.SALES_REP);

        lead = new Lead();
        lead.setName("Lead A");
        lead.setOwner(rep);
    }

    private FollowUp followUp(String title, LocalDateTime dueAt, LocalDateTime completedAt) {
        FollowUp f = new FollowUp();
        f.setLead(lead);
        f.setAssignedTo(rep);
        f.setType(FollowUpType.CALL);
        f.setTitle(title);
        f.setDueAt(dueAt);
        f.setCompletedAt(completedAt);
        return f;
    }

    @Test
    void overdueIsComputedFromDueDateAndCompletionStatus() {
        LocalDateTime now = LocalDateTime.now();

        FollowUpResponse pastDueOpen = FollowUpResponse.from(followUp("a", now.minusHours(1), null));
        FollowUpResponse pastDueCompleted = FollowUpResponse.from(
                followUp("b", now.minusDays(2), now.minusDays(1)));
        FollowUpResponse futureOpen = FollowUpResponse.from(followUp("c", now.plusDays(1), null));

        assertTrue(pastDueOpen.overdue());
        assertFalse(pastDueOpen.completed());

        assertFalse(pastDueCompleted.overdue(), "completed items are never overdue");
        assertTrue(pastDueCompleted.completed());

        assertFalse(futureOpen.overdue());
    }

    @Test
    void salesRepScheduleIsScopedToOwnLeadsAndFilteredByStatus() {
        LocalDateTime now = LocalDateTime.now();
        when(userRepository.findByEmail("rep@example.com")).thenReturn(Optional.of(rep));
        when(followUpRepository.findVisible(1L)).thenReturn(List.of(
                followUp("overdue", now.minusDays(1), null),
                followUp("upcoming", now.plusDays(1), null),
                followUp("done", now.minusDays(3), now.minusDays(2))));

        List<FollowUpResponse> overdue = followUpService.getVisibleFollowUps(
                "rep@example.com", FollowUpService.FollowUpFilter.OVERDUE);
        List<FollowUpResponse> upcoming = followUpService.getVisibleFollowUps(
                "rep@example.com", FollowUpService.FollowUpFilter.UPCOMING);

        assertEquals(List.of("overdue"), overdue.stream().map(FollowUpResponse::title).toList());
        assertEquals(List.of("upcoming"), upcoming.stream().map(FollowUpResponse::title).toList());
        // Rep query is scoped by their user id, never the manager-wide (null) scope.
        verify(followUpRepository, times(2)).findVisible(1L);
        verify(followUpRepository, never()).findVisible(null);
    }

    @Test
    void followUpsCannotBeScheduledOnWonOrLostLeads() {
        when(userRepository.findByEmail("rep@example.com")).thenReturn(Optional.of(rep));
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));

        FollowUpRequest request = new FollowUpRequest(
                FollowUpType.CALL, "Check in", null, LocalDateTime.now().plusDays(1), null);

        for (LeadStatus closed : List.of(LeadStatus.WON, LeadStatus.LOST)) {
            lead.setStatus(closed);
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> followUpService.createFollowUp(1L, request, "rep@example.com"));
            assertTrue(ex.getMessage().contains("Won or Lost"));
        }

        verify(followUpRepository, never()).save(any());
    }

    @Test
    void pastDueDateIsAcceptedAndImmediatelyOverdue() {
        // Documented behaviour: a past due date is allowed (e.g. logging a missed call),
        // and the follow-up is reported as overdue straight away.
        lead.setStatus(LeadStatus.CONTACTED);
        when(userRepository.findByEmail("rep@example.com")).thenReturn(Optional.of(rep));
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));
        when(followUpRepository.save(any(FollowUp.class))).thenAnswer(inv -> inv.getArgument(0));

        FollowUpRequest request = new FollowUpRequest(
                FollowUpType.TASK, "Missed callback", null, LocalDateTime.now().minusHours(3), null);

        FollowUpResponse response = followUpService.createFollowUp(1L, request, "rep@example.com");

        assertTrue(response.overdue());
        assertFalse(response.completed());
    }

    @Test
    void followUpCannotBeAssignedToSomeoneOtherThanTheLeadOwner() {
        lead.setStatus(LeadStatus.CONTACTED);
        when(userRepository.findByEmail("rep@example.com")).thenReturn(Optional.of(rep));
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));

        FollowUpRequest request = new FollowUpRequest(
                FollowUpType.CALL, "Call", null, LocalDateTime.now().plusDays(1), 2L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> followUpService.createFollowUp(1L, request, "rep@example.com"));
        assertTrue(ex.getMessage().contains("lead owner"));
        verify(followUpRepository, never()).save(any());
    }
}
