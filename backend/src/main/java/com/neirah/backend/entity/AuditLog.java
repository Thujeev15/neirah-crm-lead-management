package com.neirah.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_lead", columnList = "lead_id"),
    @Index(name = "idx_audit_time", columnList = "occurred_at")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false, updatable = false)
    private Lead lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false, updatable = false)
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, updatable = false)
    private AuditEventType eventType;

    @Column(name = "old_value", length = 500, updatable = false)
    private String oldValue;

    @Column(name = "new_value", length = 500, updatable = false)
    private String newValue;

    @Column(nullable = false, updatable = false)
    private LocalDateTime occurredAt;

    @PrePersist
    protected void onCreate() {
        occurredAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Lead getLead() { return lead; }
    public User getActor() { return actor; }
    public AuditEventType getEventType() { return eventType; }
    public String getOldValue() { return oldValue; }
    public String getNewValue() { return newValue; }
    public LocalDateTime getOccurredAt() { return occurredAt; }

    public void setLead(Lead lead) { this.lead = lead; }
    public void setActor(User actor) { this.actor = actor; }
    public void setEventType(AuditEventType eventType) { this.eventType = eventType; }
    public void setOldValue(String oldValue) { this.oldValue = oldValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }
}