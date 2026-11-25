package com.neirah.backend.service;

import com.neirah.backend.dto.ConversionResponse;
import com.neirah.backend.entity.*;
import com.neirah.backend.repository.CustomerRepository;
import com.neirah.backend.repository.LeadRepository;
import com.neirah.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConversionService {

    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;

    public ConversionService(CustomerRepository customerRepository,
                             LeadRepository leadRepository,
                             UserRepository userRepository) {
        this.customerRepository = customerRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ConversionResponse convertLead(Long leadId, String userEmail) {
        User actor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Lead lead = leadRepository.findByIdForUpdate(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));

        if (actor.getRole() != Role.MANAGER &&
                (lead.getOwner() == null ||
                 !lead.getOwner().getId().equals(actor.getId()))) {
            throw new AccessDeniedException("You cannot convert this lead");
        }

        var existingCustomer = customerRepository.findByLeadId(leadId);
        if (existingCustomer.isPresent()) {
            return ConversionResponse.from(existingCustomer.get(), true);
        }

        if (lead.getStatus() != LeadStatus.WON) {
            throw new IllegalStateException("Only WON leads can be converted to customers");
        }

        Customer customer = new Customer();
        customer.setLead(lead);
        customer.setName(lead.getName());
        customer.setCompany(lead.getCompany());
        customer.setEmail(lead.getEmail());
        customer.setPhone(lead.getPhone());

        Customer savedCustomer = customerRepository.save(customer);
        return ConversionResponse.from(savedCustomer, false);
    }
}
