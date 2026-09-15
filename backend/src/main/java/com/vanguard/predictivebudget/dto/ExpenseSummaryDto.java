package com.vanguard.predictivebudget.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseSummaryDto {
    private BigDecimal totalPredictedSpend;
    private long totalExpensesCount;
    private long highConfidenceCount;
    private BigDecimal highConfidenceSpend;
    private long pendingReviewCount;
    private BigDecimal pendingReviewSpend;
    private long approvedCount;
    private BigDecimal approvedSpend;
}
