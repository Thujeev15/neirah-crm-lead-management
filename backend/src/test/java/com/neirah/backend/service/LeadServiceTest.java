


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
                IllegalArgumentException.class,
                () -> leadService.createLead(request, "rep@example.com")
        );

        verify(leadRepository, never()).save(any(Lead.class));
    }

}
