package com.vanguard.predictivebudget.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "predicted_expense")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictedExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workspace_id")
    private Long workspaceId;

    @Column(name = "raw_message_id")
    private Long rawMessageId;

    @Column(name = "item_description", nullable = false)
    private String itemDescription;

    @Column(name = "estimated_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal estimatedAmount;

    @Column(name = "confidence_score", nullable = false)
    private Integer confidenceScore;

    @Column(name = "predicted_date")
    private LocalDate predictedDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ExpenseStatus status = ExpenseStatus.PENDING;

    @Column(name = "source_type")
    @Builder.Default
    private String sourceType = "SLACK";

    @Column(name = "source_channel_or_subject")
    private String sourceChannelOrSubject;

    @Column(name = "raw_snippet", columnDefinition = "TEXT")
    private String rawSnippet;

    @Column(name = "ai_reasoning", columnDefinition = "TEXT")
    private String aiReasoning;

    @Column(name = "department")
    @Builder.Default
    private String department = "INFRASTRUCTURE";

    @Column(name = "cost_range_min", precision = 12, scale = 2)
    private BigDecimal costRangeMin;

    @Column(name = "cost_range_max", precision = 12, scale = 2)
    private BigDecimal costRangeMax;

    @Column(name = "thread_ts")
    private String threadTs;

    @Column(name = "topic_key")
    private String topicKey;

    @Column(name = "is_benchmark_estimate")
    @Builder.Default
    private Boolean isBenchmarkEstimate = false;

    @Column(name = "conversation_context", columnDefinition = "TEXT")
    private String conversationContext;

    @Column(name = "revision_count")
    @Builder.Default
    private Integer revisionCount = 1;

    @Column(name = "advance_days_notice")
    private Integer advanceDaysNotice;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
