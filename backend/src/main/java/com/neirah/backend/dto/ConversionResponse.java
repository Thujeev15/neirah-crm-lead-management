package com.neirah.backend.dto;

import com.neirah.backend.entity.Customer;

import java.time.LocalDateTime;

/**
 * Result of converting a lead.
 *
 * @param leadId                   the lead that was converted (the request's lead)
 * @param sourceLeadId             the lead the customer record was originally created from
 * @param alreadyConverted         true when this lead had already been converted (idempotent repeat)
 * @param linkedToExistingCustomer true when the lead was linked to an existing customer with the
 *                                 same email instead of creating a new one
 */
public record ConversionResponse(
        Long customerId,
        Long leadId,
        Long sourceLeadId,
        String name,
        String company,
        String email,
        String phone,
        LocalDateTime convertedAt,
        boolean alreadyConverted,
        boolean linkedToExistingCustomer
) {
    public static ConversionResponse from(Customer customer, Long leadId,
                                          boolean alreadyConverted, boolean linkedToExistingCustomer) {
        return new ConversionResponse(
                customer.getId(),
                leadId,
                customer.getLead().getId(),
                customer.getName(),
                customer.getCompany(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getConvertedAt(),
                alreadyConverted,
                linkedToExistingCustomer
        );
    }
}
