package com.neirah.backend.dto;

import com.neirah.backend.entity.Customer;
import java.time.LocalDateTime;

public record ConversionResponse(
        Long customerId,
        Long leadId,
        String name,
        String company,
        String email,
        String phone,
        LocalDateTime convertedAt,
        boolean alreadyConverted
) {
    public static ConversionResponse from(Customer customer, boolean alreadyConverted) {
        return new ConversionResponse(
                customer.getId(),
                customer.getLead().getId(),
                customer.getName(),
                customer.getCompany(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getConvertedAt(),
                alreadyConverted
        );
    }
}
