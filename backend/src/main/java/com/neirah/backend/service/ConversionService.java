package com.neirah.backend.service;

import com.neirah.backend.dto.ConversionResponse;
import com.neirah.backend.entity.*;
import com.neirah.backend.repository.AuditLogRepository;
import com.neirah.backend.repository.CustomerRepository;
import com.neirah.backend.repository.LeadRepository;
import com.neirah.backend.repository.UserRepository;
import com.neirah.backend.util.ContactNormalizer;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Converts Won leads into customers.
 *
 * Duplicate safety works at two levels:
 *  1. The same lead converted twice returns the same customer (idempotent; the lead row is
 *     locked for the duration of the transaction).
 *  2. A different Won lead for the same person (same normalised email) is linked to the
 *     existing customer instead of creating a second customer. A unique index on
 *     customers.email_normalized backs this up under concurrency.
 */
@Service
public class ConversionService {

    private static final Logger log = LoggerFactory.getLogger(ConversionService.class);

    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    public ConversionService(CustomerRepository customerRepository,
                             LeadRepository leadRepository,
                             UserRepository userRepository,
                             AuditLogRepository auditLogRepository) {
        this.customerRepository = customerRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public ConversionResponse convertLead(Long leadId, String userEmail) {
        User actor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Lead lead = leadRepository.findByIdForUpdate(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));

        checkAccess(lead, actor, "You cannot convert this lead");

        // 1. Idempotent repeat: this lead already points at a customer.
        if (lead.getCustomer() != null) {
            Customer existing = lead.getCustomer();
            log.info("Lead {} already converted to customer {}; returning existing record (idempotent) for {}",
                    leadId, existing.getId(), userEmail);
            return ConversionResponse.from(existing, leadId, true,
                    !java.util.Objects.equals(existing.getLead().getId(), leadId));
        }

        if (lead.getStatus() != LeadStatus.WON) {
            throw new IllegalStateException("Only WON leads can be converted to customers");
        }

        // 2. Same person already a customer (matched on normalised email): link, don't duplicate.
        String emailNormalized = ContactNormalizer.email(lead.getEmail());
        Optional<Customer> samePersonCustomer = emailNormalized == null
                ? Optional.empty()
                : customerRepository.findByEmailNormalized(emailNormalized);

        if (samePersonCustomer.isPresent()) {
            Customer existing = samePersonCustomer.get();
            lead.setCustomer(existing);
            leadRepository.save(lead);
            recordConversion(lead, actor, "Linked to existing customer #" + existing.getId());
            log.info("Lead {} linked to existing customer {} (same email) by {}",
                    leadId, existing.getId(), userEmail);
            return ConversionResponse.from(existing, leadId, false, true);
        }

        // 3. New customer.
        Customer customer = new Customer();
        customer.setLead(lead);
        customer.setName(lead.getName());
        customer.setCompany(lead.getCompany());
        customer.setEmail(lead.getEmail());
        customer.setEmailNormalized(emailNormalized);
        customer.setPhone(lead.getPhone());

        Customer savedCustomer = customerRepository.save(customer);
        lead.setCustomer(savedCustomer);
        leadRepository.save(lead);
        recordConversion(lead, actor, "Customer #" + savedCustomer.getId());

        log.info("Lead {} converted to customer {} by {}", leadId, savedCustomer.getId(), userEmail);
        return ConversionResponse.from(savedCustomer, leadId, false, false);
    }

    /** Returns the customer this lead converted into, or 404 if it has not been converted. */
    @Transactional(readOnly = true)
    public ConversionResponse getCustomerForLead(Long leadId, String userEmail) {
        User actor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));

        checkAccess(lead, actor, "You cannot view this lead");

        Customer customer = lead.getCustomer();
        if (customer == null) {
            throw new EntityNotFoundException("Lead has not been converted");
        }
        return ConversionResponse.from(customer, leadId, true,
                !java.util.Objects.equals(customer.getLead().getId(), leadId));
    }

    private void checkAccess(Lead lead, User actor, String message) {
        if (actor.getRole() != Role.MANAGER &&
                (lead.getOwner() == null ||
                 !lead.getOwner().getId().equals(actor.getId()))) {
            throw new AccessDeniedException(message);
        }
    }

    private void recordConversion(Lead lead, User actor, String detail) {
        AuditLog audit = new AuditLog();
        audit.setLead(lead);
        audit.setActor(actor);
        audit.setEventType(AuditEventType.CONVERTED);
        audit.setNewValue(detail);
        auditLogRepository.save(audit);
    }
}
