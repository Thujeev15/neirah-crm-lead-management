
package com.neirah.backend.repository;

import com.neirah.backend.entity.Lead;
import com.neirah.backend.entity.LeadStatus;
import com.neirah.backend.entity.Priority;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LeadRepository extends JpaRepository<Lead, Long> {

    List<Lead> findByEmailNormalized(String emailNormalized);

    List<Lead> findByPhoneNormalized(String phoneNormalized);

    List<Lead> findByOwnerEmail(String email);

    @Query("""
        SELECT l FROM Lead l
        WHERE (:search IS NULL OR
            LOWER(l.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(l.company) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(l.email) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(l.phone) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:status IS NULL OR l.status = :status)
        AND (:priority IS NULL OR l.priority = :priority)
        AND (:ownerEmail IS NULL OR l.owner.email = :ownerEmail)
        """)
    Page<Lead> searchLeads(
        @Param("search") String search,
        @Param("status") LeadStatus status,
        @Param("priority") Priority priority,
        @Param("ownerEmail") String ownerEmail,
        Pageable pageable
    );
}
