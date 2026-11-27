package com.neirah.backend.repository;

import com.neirah.backend.entity.Lead;
import com.neirah.backend.entity.LeadStatus;
import com.neirah.backend.entity.Priority;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LeadRepository extends JpaRepository<Lead, Long> {

    List<Lead> findByEmailNormalized(String emailNormalized);

    List<Lead> findByPhoneNormalized(String phoneNormalized);

    List<Lead> findByOwnerEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM Lead l WHERE l.id = :id")
    Optional<Lead> findByIdForUpdate(@Param("id") Long id);

    @Query("""
        SELECT l FROM Lead l
        WHERE (:search IS NULL OR
            LOWER(l.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(l.company) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(l.email) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(l.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR
            (:searchDigits IS NOT NULL AND l.phoneNormalized LIKE CONCAT('%', :searchDigits, '%')))
        AND (:status IS NULL OR l.status = :status)
        AND (:priority IS NULL OR l.priority = :priority)
        AND (:ownerEmail IS NULL OR l.owner.email = :ownerEmail)
        """)
    Page<Lead> searchLeads(
        @Param("search") String search,
        @Param("searchDigits") String searchDigits,
        @Param("status") LeadStatus status,
        @Param("priority") Priority priority,
        @Param("ownerEmail") String ownerEmail,
        Pageable pageable
    );

    @Query("""
        SELECT l.status, COUNT(l) FROM Lead l
        WHERE (:ownerId IS NULL OR l.owner.id = :ownerId)
        GROUP BY l.status
        """)
    List<Object[]> countByStatus(@Param("ownerId") Long ownerId);

    @Query("""
        SELECT o.fullName, o.email, COUNT(l) FROM Lead l
        LEFT JOIN l.owner o
        WHERE (:ownerId IS NULL OR o.id = :ownerId)
        GROUP BY o.id, o.fullName, o.email
        ORDER BY COUNT(l) DESC
        """)
    List<Object[]> countByOwner(@Param("ownerId") Long ownerId);

    @Query("""
        SELECT COALESCE(SUM(l.dealValue), 0) FROM Lead l
        WHERE l.status = com.neirah.backend.entity.LeadStatus.WON
          AND (:ownerId IS NULL OR l.owner.id = :ownerId)
        """)
    java.math.BigDecimal sumWonDealValue(@Param("ownerId") Long ownerId);
}
