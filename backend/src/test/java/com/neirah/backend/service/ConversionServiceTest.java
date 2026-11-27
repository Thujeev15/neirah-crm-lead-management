package com.neirah.backend.service;

import com.neirah.backend.dto.ConversionResponse;
import com.neirah.backend.entity.*;
import com.neirah.backend.repository.CustomerRepository;
import com.neirah.backend.repository.LeadRepository;
import com.neirah.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversionServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ConversionService conversionService;

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
        lead.setEmail("customer@example.com");
        lead.setPhone("0771234567");
        lead.setOwner(salesRep);
        lead.setStatus(LeadStatus.WON);
    }

    @Test
    void firstConversionCreatesCustomer() {
        when(userRepository.findByEmail("rep@example.com"))
                .thenReturn(Optional.of(salesRep));
        when(leadRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(lead));
        when(customerRepository.findByLeadId(1L))
                .thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class)))
                .thenAnswer(invocation -> {
                    Customer customer = invocation.getArgument(0);
                    return customer;
                });

        ConversionResponse response =
                conversionService.convertLead(1L, "rep@example.com");

        assertFalse(response.alreadyConverted());
        assertEquals("Test Customer", response.name());
        verify(customerRepository, times(1)).save(any(Customer.class));
    }

    @Test
    void repeatedConversionReturnsExistingCustomer() {
        Customer existingCustomer = new Customer();
        existingCustomer.setLead(lead);
        existingCustomer.setName("Test Customer");
        existingCustomer.setCompany("Test Company");
        existingCustomer.setEmail("customer@example.com");
        existingCustomer.setPhone("0771234567");

        when(userRepository.findByEmail("rep@example.com"))
                .thenReturn(Optional.of(salesRep));
        when(leadRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(lead));
        when(customerRepository.findByLeadId(1L))
                .thenReturn(Optional.of(existingCustomer));

        ConversionResponse response =
                conversionService.convertLead(1L, "rep@example.com");

        assertTrue(response.alreadyConverted());
        assertEquals("Test Customer", response.name());
        verify(customerRepository, never()).save(any(Customer.class));
    }
}
