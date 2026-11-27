package com.neirah.backend.repository;

import com.neirah.backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByLeadId(Long leadId);

    Optional<Customer> findByEmailNormalized(String emailNormalized);

    @org.springframework.data.jpa.repository.Query("""
        SELECT COUNT(c) FROM Customer c
        WHERE (:ownerId IS NULL OR c.lead.owner.id = :ownerId)
        """)
    long countVisible(@org.springframework.data.repository.query.Param("ownerId") Long ownerId);
}
