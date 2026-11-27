package com.neirah.backend.repository;

import com.neirah.backend.entity.FollowUp;
import com.neirah.backend.entity.User;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {

    List<FollowUp> findByLeadIdOrderByDueAtAsc(Long leadId);

    /** Moves every open (not completed) follow-up of a lead to a new assignee. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
        UPDATE FollowUp f SET f.assignedTo = :newOwner
        WHERE f.lead.id = :leadId AND f.completedAt IS NULL
        """)
    int reassignOpenFollowUps(@Param("leadId") Long leadId, @Param("newOwner") User newOwner);

    /**
     * All follow-ups visible to a user. A null ownerId means "all leads" (manager view);
     * otherwise only follow-ups on leads currently owned by that user are returned.
     */
    @Query("""
        SELECT f FROM FollowUp f
        JOIN FETCH f.lead l
        LEFT JOIN FETCH f.assignedTo
        WHERE (:ownerId IS NULL OR l.owner.id = :ownerId)
        ORDER BY f.dueAt ASC
        """)
    List<FollowUp> findVisible(@Param("ownerId") Long ownerId);

    /** Overdue = not completed AND due before now. Never based on a manual label. */
    @Query("""
        SELECT COUNT(f) FROM FollowUp f
        WHERE f.completedAt IS NULL
          AND f.dueAt < :now
          AND (:ownerId IS NULL OR f.lead.owner.id = :ownerId)
        """)
    long countOverdue(@Param("ownerId") Long ownerId, @Param("now") LocalDateTime now);

    @Query("""
        SELECT COUNT(f) FROM FollowUp f
        WHERE f.completedAt IS NULL
          AND f.dueAt >= :now
          AND (:ownerId IS NULL OR f.lead.owner.id = :ownerId)
        """)
    long countUpcoming(@Param("ownerId") Long ownerId, @Param("now") LocalDateTime now);
}
