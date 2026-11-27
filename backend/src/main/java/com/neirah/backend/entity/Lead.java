package com.neirah.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "leads", indexes = {
    @Index(name = "idx_lead_email_normalized", columnList = "email_normalized"),
    @Index(name = "idx_lead_phone_normalized", columnList = "phone_normalized"),
    @Index(name = "idx_lead_owner", columnList = "owner_id"),
    @Index(name = "idx_lead_status", columnList = "status")
})
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 150)
    private String company;

    @Column(length = 150)
    private String email;

    @Column(name = "email_normalized", length = 150)
    private String emailNormalized;

    @Column(length = 30)
    private String phone;

    @Column(name = "phone_normalized", length = 30)
    private String phoneNormalized;

    @Column(length = 50)
    private String source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LeadStatus status = LeadStatus.NEW;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    /** Customer this lead converted into. Several Won leads can share one customer. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(precision = 12, scale = 2)
    private BigDecimal dealValue;

    @Column(length = 500)
    private String lossReason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Version
    private Long version;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCompany() { return company; }
    public String getEmail() { return email; }
    public String getEmailNormalized() { return emailNormalized; }
    public String getPhone() { return phone; }
    public String getPhoneNormalized() { return phoneNormalized; }
    public String getSource() { return source; }
    public Priority getPriority() { return priority; }
    public LeadStatus getStatus() { return status; }
    public User getOwner() { return owner; }
    public User getCreatedBy() { return createdBy; }
    public BigDecimal getDealValue() { return dealValue; }
    public String getLossReason() { return lossReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public Long getVersion() { return version; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public void setName(String name) { this.name = name; }
    public void setCompany(String company) { this.company = company; }
    public void setEmail(String email) { this.email = email; }
    public void setEmailNormalized(String emailNormalized) { this.emailNormalized = emailNormalized; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setPhoneNormalized(String phoneNormalized) { this.phoneNormalized = phoneNormalized; }
    public void setSource(String source) { this.source = source; }
    public void setPriority(Priority priority) { this.priority = priority; }
    public void setStatus(LeadStatus status) { this.status = status; }
    public void setOwner(User owner) { this.owner = owner; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public void setDealValue(BigDecimal dealValue) { this.dealValue = dealValue; }
    public void setLossReason(String lossReason) { this.lossReason = lossReason; }
}