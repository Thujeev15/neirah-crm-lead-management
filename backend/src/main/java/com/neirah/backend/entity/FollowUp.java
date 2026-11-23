package com.neirah.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "follow_ups", indexes = {
    @Index(name = "idx_followup_lead", columnList = "lead_id"),
    @Index(name = "idx_followup_due", columnList = "due_at"),
    @Index(name = "idx_followup_assigned", columnList = "assigned_to")
})
public class FollowUp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FollowUpType type;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(name = "due_at", nullable = false)
    private LocalDateTime dueAt;

    private LocalDateTime completedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Lead getLead() { return lead; }
    public User getCreatedBy() { return createdBy; }
    public User getAssignedTo() { return assignedTo; }
    public FollowUpType getType() { return type; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public LocalDateTime getDueAt() { return dueAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setLead(Lead lead) { this.lead = lead; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }
    public void setType(FollowUpType type) { this.type = type; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setDueAt(LocalDateTime dueAt) { this.dueAt = dueAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}