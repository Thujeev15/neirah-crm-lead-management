package com.neirah.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "activities", indexes = {
    @Index(name = "idx_activity_lead", columnList = "lead_id"),
    @Index(name = "idx_activity_created", columnList = "created_at")
})
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ActivityType type;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Lead getLead() { return lead; }
    public User getActor() { return actor; }
    public ActivityType getType() { return type; }
    public String getDescription() { return description; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setLead(Lead lead) { this.lead = lead; }
    public void setActor(User actor) { this.actor = actor; }
    public void setType(ActivityType type) { this.type = type; }
    public void setDescription(String description) { this.description = description; }
}