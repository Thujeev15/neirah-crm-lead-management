


package com.neirah.backend.service;

import com.neirah.backend.entity.*;
import com.neirah.backend.dto.LeadRequest;
import com.neirah.backend.repository.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeadServiceTest {

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private FollowUpRepository followUpRepository;

    @InjectMocks
    private LeadService leadService;

    private User salesRep;
    private User otherRep;
    private Lead lead;

    @BeforeEach
    void setUp() {

        salesRep = new User();
        salesRep.setId(1L);
        salesRep.setEmail("rep@example.com");
        salesRep.setRole(Role.SALES_REP);

        otherRep = new User();
        otherRep.setId(2L);
        otherRep.setEmail("other@example.com");
        otherRep.setRole(Role.SALES_REP);

        lead = new Lead();
        lead.setName("Test Lead");
        lead.setOwner(otherRep);
        lead.setStatus(LeadStatus.NEW);
    }

    @Test
    void salesRepCannotViewAnotherOwnersLead() {

        when(userRepository.findByEmail("rep@example.com"))
                .thenReturn(Optional.of(salesRep));

        when(leadRepository.findById(10L))
                .thenReturn(Optional.of(lead));

        assertThrows(
                AccessDeniedException.class,
                () -> leadService.getLeadById(10L, "rep@example.com")
        );
    }

    @Test
    void wonLeadRequiresPositiveDealValue() {

        when(userRepository.findByEmail("other@example.com"))
                .thenReturn(Optional.of(otherRep));

        when(leadRepository.findById(10L))
                .thenReturn(Optional.of(lead));

        assertThrows(
                IllegalArgumentException.class,
                () -> leadService.updateLeadStatus(
                        10L,
                        LeadStatus.WON,
                        BigDecimal.ZERO,
                        null,
                        "other@example.com"
                )
        );

        verify(leadRepository, never()).save(any(Lead.class));
    }

    @Test
    void lostLeadRequiresReason() {

        lead.setStatus(LeadStatus.QUALIFIED);

        when(userRepository.findByEmail("other@example.com"))
                .thenReturn(Optional.of(otherRep));

        when(leadRepository.findById(10L))
                .thenReturn(Optional.of(lead));

        assertThrows(
                IllegalArgumentException.class,
                () -> leadService.updateLeadStatus(
                        10L,
                        LeadStatus.LOST,
                        null,
                        "   ",
                        "other@example.com"
                )
        );

        verify(leadRepository, never()).save(any(Lead.class));
    }

    @Test
    void salesRepCannotUpdateAnotherOwnersLead() {

        when(userRepository.findByEmail("rep@example.com"))
                .thenReturn(Optional.of(salesRep));

        when(leadRepository.findById(10L))
                .thenReturn(Optional.of(lead));

        assertThrows(
                AccessDeniedException.class,
                () -> leadService.updateLeadStatus(
                        10L,
                        LeadStatus.CONTACTED,
                        null,
                        null,
                        "rep@example.com"
                )
        );

        verify(leadRepository, never()).save(any(Lead.class));
    }

    @Test
    void invalidPipelineTransitionIsRejected() {

        when(userRepository.findByEmail("other@example.com"))
                .thenReturn(Optional.of(otherRep));

        when(leadRepository.findById(10L))
                .thenReturn(Optional.of(lead));

        assertThrows(
                IllegalArgumentException.class,
                () -> leadService.updateLeadStatus(
                        10L,
                        LeadStatus.WON,
                        new BigDecimal("5000"),
                        null,
                        "other@example.com"
                )
        );

        verify(leadRepository, never()).save(any(Lead.class));
    }

    @Test
    void managerCanViewAllLeads() {

        User manager = new User();
        manager.setId(3L);
        manager.setEmail("manager@example.com");
        manager.setRole(Role.MANAGER);

        when(userRepository.findByEmail("manager@example.com"))
                .thenReturn(Optional.of(manager));

        when(leadRepository.findAll())
                .thenReturn(List.of(lead));

        List<Lead> result =
                leadService.getAllLeads("manager@example.com");

        assertEquals(1, result.size());
        assertSame(lead, result.get(0));

        verify(leadRepository).findAll();
    }

    @Test
    void salesRepCanViewOwnLead() {

        lead.setOwner(salesRep);

        when(userRepository.findByEmail("rep@example.com"))
                .thenReturn(Optional.of(salesRep));

        when(leadRepository.findById(10L))
                .thenReturn(Optional.of(lead));

        Lead result =
                leadService.getLeadById(10L, "rep@example.com");

        assertSame(lead, result);
        assertEquals("Test Lead", result.getName());
    }

    @Test
    void duplicateEmailIsDetected() {

        LeadRequest request = new LeadRequest();
        request.setName("Duplicate Lead");
        request.setEmail("TEST@example.com");
        request.setPriority(Priority.MEDIUM);

        lead.setEmail("test@example.com");
        lead.setOwner(salesRep);

        when(userRepository.findByEmail("rep@example.com"))
                .thenReturn(Optional.of(salesRep));

        when(leadRepository.findByEmailNormalized("test@example.com"))
                .thenReturn(List.of(lead));

        var result = leadService.checkDuplicates(request, "rep@example.com");

        assertTrue(result.duplicateFound());
        assertEquals(1, result.matches().size());
    }

    @Test
    void duplicateLeadCreationRequiresConfirmation() {

        LeadRequest request = new LeadRequest();
        request.setName("Duplicate Lead");
        request.setEmail("test@example.com");
        request.setPriority(Priority.MEDIUM);
        request.setConfirmDuplicate(false);

        when(userRepository.findByEmail("rep@example.com"))
                .thenReturn(Optional.of(salesRep));

        when(leadRepository.findByEmailNormalized("test@example.com"))
                .thenReturn(List.of(lead));

        assertThrows(
                com.neirah.backend.exception.DuplicateResourceException.class,
                () -> leadService.createLead(request, "rep@example.com")
        );

        verify(leadRepository, never()).save(any(Lead.class));
    }


    // ---------------------------------------------------------------
    // Assignment rules (Business rules 3, 4 and 8)
    // ---------------------------------------------------------------

    @Test
    void salesRepCannotAssignLead() {
        when(userRepository.findByEmail("rep@example.com"))
                .thenReturn(Optional.of(salesRep));

        assertThrows(
                AccessDeniedException.class,
                () -> leadService.assignLead(1L, "other@example.com", "rep@example.com")
        );

        verify(auditLogRepository, never()).save(any());
        verify(leadRepository, never()).save(any(Lead.class));
    }

    @Test
    void managerReassignmentRecordsAuditEventAndKeepsLeadRecord() {
        User manager = new User();
        manager.setId(10L);
        manager.setEmail("manager@example.com");
        manager.setRole(Role.MANAGER);

        when(userRepository.findByEmail("manager@example.com")).thenReturn(Optional.of(manager));
        when(userRepository.findByEmail("rep@example.com")).thenReturn(Optional.of(salesRep));
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));

        Lead result = leadService.assignLead(1L, "rep@example.com", "manager@example.com");

        // Same lead object is updated in place: notes, follow-ups and history stay linked to it.
        assertSame(lead, result);
        assertEquals(salesRep, result.getOwner());

        org.mockito.ArgumentCaptor<AuditLog> audit = org.mockito.ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(audit.capture());
        assertEquals(AuditEventType.OWNER_CHANGED, audit.getValue().getEventType());
        assertEquals("other@example.com", audit.getValue().getOldValue());
        assertEquals("rep@example.com", audit.getValue().getNewValue());
        assertEquals(manager, audit.getValue().getActor());
        verify(leadRepository, never()).delete(any(Lead.class));
        // Open follow-ups move to the new owner (completed ones are untouched by the query).
        verify(followUpRepository).reassignOpenFollowUps(1L, salesRep);
    }

    @Test
    void pipelineTransitionRecordsStatusAuditEvent() {
        lead.setOwner(salesRep);

        when(userRepository.findByEmail("rep@example.com")).thenReturn(Optional.of(salesRep));
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));

        leadService.updateLeadStatus(1L, LeadStatus.CONTACTED, null, null, "rep@example.com");

        org.mockito.ArgumentCaptor<AuditLog> audit = org.mockito.ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(audit.capture());
        assertEquals(AuditEventType.STATUS_CHANGED, audit.getValue().getEventType());
        assertEquals("NEW", audit.getValue().getOldValue());
        assertEquals("CONTACTED", audit.getValue().getNewValue());
        assertEquals(salesRep, audit.getValue().getActor());
    }

    // ---------------------------------------------------------------
    // Duplicate detection (Business rule 6)
    // ---------------------------------------------------------------

    @Test
    void phoneDuplicateIsDetectedAfterNormalisation() {
        LeadRequest request = new LeadRequest();
        request.setName("Formatted Phone");
        request.setPhone("+94 (77) 123-4567");
        request.setPriority(Priority.LOW);

        when(userRepository.findByEmail("rep@example.com")).thenReturn(Optional.of(salesRep));
        when(leadRepository.findByPhoneNormalized("94771234567")).thenReturn(List.of(lead));

        var result = leadService.checkDuplicates(request, "rep@example.com");

        assertTrue(result.duplicateFound());
        // The match is owned by another rep, so its details are hidden from this rep.
        assertTrue(result.matches().isEmpty());
    }

    @Test
    void missingEmailAndPhoneSkipDuplicateLookupAndCreateLead() {
        LeadRequest request = new LeadRequest();
        request.setName("Walk-in Lead");
        request.setEmail("   ");
        request.setPhone(null);
        request.setPriority(Priority.MEDIUM);

        when(userRepository.findByEmail("rep@example.com")).thenReturn(Optional.of(salesRep));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));

        Lead created = leadService.createLead(request, "rep@example.com");

        assertNull(created.getEmailNormalized());
        assertNull(created.getPhoneNormalized());
        verify(leadRepository, never()).findByEmailNormalized(any());
        verify(leadRepository, never()).findByPhoneNormalized(any());
    }

    // ---------------------------------------------------------------
    // Review fixes
    // ---------------------------------------------------------------

    private LeadRequest editRequest(String email) {
        LeadRequest request = new LeadRequest();
        request.setName("Edited Name");
        request.setEmail(email);
        request.setPriority(Priority.HIGH);
        return request;
    }

    @Test
    void confirmedDuplicateLeadCanStillBeEditedWhenEmailIsUnchanged() {
        // Lead was created as a confirmed duplicate of another lead with the same email.
        lead.setOwner(salesRep);
        lead.setEmail("shared@example.com");
        lead.setEmailNormalized("shared@example.com");

        when(userRepository.findByEmail("rep@example.com")).thenReturn(Optional.of(salesRep));
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));

        Lead updated = leadService.updateLead(1L, editRequest("Shared@Example.com"), "rep@example.com");

        assertEquals(Priority.HIGH, updated.getPriority());
        verify(leadRepository, never()).findByEmailNormalized(any());
    }

    @Test
    void changingEmailToAnotherLeadsEmailRequiresConfirmation() {
        lead.setOwner(salesRep);
        lead.setEmailNormalized("old@example.com");
        Lead other = mock(Lead.class);
        when(other.getId()).thenReturn(99L);

        when(userRepository.findByEmail("rep@example.com")).thenReturn(Optional.of(salesRep));
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));
        when(leadRepository.findByEmailNormalized("taken@example.com")).thenReturn(List.of(other));

        assertThrows(com.neirah.backend.exception.DuplicateResourceException.class,
                () -> leadService.updateLead(1L, editRequest("taken@example.com"), "rep@example.com"));
        verify(leadRepository, never()).save(any(Lead.class));

        // Confirming the warning lets the edit through.
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));
        LeadRequest confirmed = editRequest("taken@example.com");
        confirmed.setConfirmDuplicate(true);
        assertEquals("taken@example.com",
                leadService.updateLead(1L, confirmed, "rep@example.com").getEmailNormalized());
    }

    @Test
    void newLeadCanBeMarkedLostWithReason() {
        lead.setOwner(salesRep);
        when(userRepository.findByEmail("rep@example.com")).thenReturn(Optional.of(salesRep));
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));

        Lead lost = leadService.updateLeadStatus(1L, LeadStatus.LOST, null, "Spam enquiry", "rep@example.com");

        assertEquals(LeadStatus.LOST, lost.getStatus());
        assertEquals("Spam enquiry", lost.getLossReason());
    }
}
