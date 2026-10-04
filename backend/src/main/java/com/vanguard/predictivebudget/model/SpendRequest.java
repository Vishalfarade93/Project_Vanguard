package com.vanguard.predictivebudget.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "spend_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpendRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workspace_id")
    private Long workspaceId;

    @Column(name = "requester_name", nullable = false)
    private String requesterName;

    @Column(name = "requester_channel")
    private String requesterChannel;

    @Column(name = "item_description", nullable = false)
    private String itemDescription;

    @Column(name = "department")
    @Builder.Default
    private String department = "OPERATIONS";

    @Column(name = "requested_amount", precision = 12, scale = 2)
    private BigDecimal requestedAmount;

    @Column(name = "approved_amount", precision = 12, scale = 2)
    private BigDecimal approvedAmount;

    @Column(name = "policy_threshold", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal policyThreshold = new BigDecimal("300.00");

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SpendRequestStatus status = SpendRequestStatus.PENDING_APPROVAL;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    // ── Single-Use Virtual Card Fields ──────────────────────────────────────
    @Column(name = "card_token")
    private String cardToken;

    @Column(name = "masked_card_number")
    private String maskedCardNumber;

    @Column(name = "cardholder_name")
    private String cardholderName;

    @Column(name = "cvv")
    private String cvv;

    @Column(name = "expiry_date")
    private String expiryDate;

    @Column(name = "mcc_category_lock")
    private String mccCategoryLock;

    @Column(name = "is_burned")
    @Builder.Default
    private Boolean isBurned = false;

    // ── Audit & Receipt Reconciliation Fields ──────────────────────────────
    @Column(name = "actual_charged_amount", precision = 12, scale = 2)
    private BigDecimal actualChargedAmount;

    @Column(name = "merchant_name")
    private String merchantName;

    @Column(name = "receipt_snippet", columnDefinition = "TEXT")
    private String receiptSnippet;

    @Column(name = "receipt_verified")
    @Builder.Default
    private Boolean receiptVerified = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.policyThreshold == null) {
            this.policyThreshold = new BigDecimal("300.00");
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
