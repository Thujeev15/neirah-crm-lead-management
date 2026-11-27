package com.neirah.backend.service;

import com.neirah.backend.dto.ConversionResponse;
import com.neirah.backend.entity.*;
import com.neirah.backend.repository.AuditLogRepository;
import com.neirah.backend.repository.CustomerRepository;
import com.neirah.backend.repository.LeadRepository;
import com.neirah.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Business rule 7: conversion is idempotent and never creates duplicate customers. */
@ExtendWith(MockitoExtension.class)
class ConversionServiceTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private LeadRepository leadRepository;
    @Mock private UserRepository userRepository;
    @Mock private AuditLogRepository auditLogRepository;

    @InjectMocks private ConversionService conversionService;

    private User salesRep;
    private Lead lead;

    @BeforeEach
    void setUp() {
        salesRep = new User();
        salesRep.setId(1L);
        salesRep.setEmail("rep@example.com");
        salesRep.setRole(Role.SALES_REP);

        lead = new Lead();
        lead.setName("Test Customer");
        lead.setCompany("Test Company");
        lead.setEmail("Customer@Example.com");
        lead.setPhone("0771234567");
        lead.setOwner(salesRep);
        lead.setStatus(LeadStatus.WON);

        when(userRepository.findByEmail("rep@example.com")).thenReturn(Optional.of(salesRep));
        when(leadRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(lead));
    }

    @Test
    void firstConversionCreatesCustomerLinksLeadAndRecordsTimelineEvent() {
        when(customerRepository.findByEmailNormalized("customer@example.com")).thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));

        ConversionResponse response = conversionService.convertLead(1L, "rep@example.com");

        assertFalse(response.alreadyConverted());
        assertFalse(response.linkedToExistingCustomer());
        assertEquals("Test Customer", response.name());
        assertNotNull(lead.getCustomer(), "lead must point at its customer");
        assertEquals("customer@example.com", lead.getCustomer().getEmailNormalized());
        verify(customerRepository, times(1)).save(any(Customer.class));

        ArgumentCaptor<AuditLog> audit = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(audit.capture());
        assertEquals(AuditEventType.CONVERTED, audit.getValue().getEventType());
        assertEquals(salesRep, audit.getValue().getActor());
    }

    @Test
    void repeatedConversionReturnsExistingCustomer() {
        Customer existing = new Customer();
        existing.setLead(lead);
        existing.setName("Test Customer");
        lead.setCustomer(existing);

        ConversionResponse response = conversionService.convertLead(1L, "rep@example.com");

        assertTrue(response.alreadyConverted());
        verify(customerRepository, never()).save(any(Customer.class));
        verify(auditLogRepository, never()).save(any());
    }

    @Test
    void wonLeadForExistingCustomerEmailIsLinkedNotDuplicated() {
        Lead earlierLead = new Lead();
        Customer existing = new Customer();
        existing.setLead(earlierLead);
        existing.setName("Test Customer");
        existing.setEmailNormalized("customer@example.com");
        when(customerRepository.findByEmailNormalized("customer@example.com")).thenReturn(Optional.of(existing));

        ConversionResponse response = conversionService.convertLead(1L, "rep@example.com");

        assertTrue(response.linkedToExistingCustomer());
        assertFalse(response.alreadyConverted());
        assertSame(existing, lead.getCustomer());
        verify(customerRepository, never()).save(any(Customer.class));
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    void nonWonLeadCannotBeConverted() {
        lead.setStatus(LeadStatus.PROPOSAL_SENT);

        assertThrows(IllegalStateException.class,
                () -> conversionService.convertLead(1L, "rep@example.com"));
        verify(customerRepository, never()).save(any(Customer.class));
    }
}
