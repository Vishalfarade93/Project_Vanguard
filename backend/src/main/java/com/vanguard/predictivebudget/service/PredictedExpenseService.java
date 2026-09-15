package com.vanguard.predictivebudget.service;

import com.vanguard.predictivebudget.dto.ExpenseSummaryDto;
import com.vanguard.predictivebudget.model.ExpenseStatus;
import com.vanguard.predictivebudget.model.PredictedExpense;
import com.vanguard.predictivebudget.repository.PredictedExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PredictedExpenseService {

    private final PredictedExpenseRepository expenseRepository;

    @Transactional(readOnly = true)
    public List<PredictedExpense> getAllExpenses() {
        return expenseRepository.findAllByOrderByPredictedDateAsc();
    }

    @Transactional(readOnly = true)
    public List<PredictedExpense> getExpensesForWorkspace(Long workspaceId) {
        return getExpensesForWorkspace(workspaceId, null);
    }

    @Transactional(readOnly = true)
    public List<PredictedExpense> getExpensesForWorkspace(Long workspaceId, String timeframe) {
        List<PredictedExpense> baseList = workspaceId == null
                ? expenseRepository.findAllByOrderByPredictedDateAsc()
                : expenseRepository.findByWorkspaceIdOrderByPredictedDateAsc(workspaceId);

        if (timeframe == null || timeframe.trim().isEmpty() || "all".equalsIgnoreCase(timeframe)) {
            return baseList;
        }

        LocalDate today = LocalDate.now();
        String tf = timeframe.trim().toLowerCase();

        return baseList.stream().filter(exp -> {
            LocalDate date = exp.getPredictedDate();
            if (date == null) {
                return !"history".equals(tf);
            }
            switch (tf) {
                case "7d":
                    return !date.isBefore(today) && !date.isAfter(today.plusDays(7));
                case "30d":
                    return !date.isBefore(today) && !date.isAfter(today.plusDays(30));
                case "90d":
                    return !date.isBefore(today) && !date.isAfter(today.plusDays(90));
                case "future":
                    return !date.isBefore(today);
                case "history":
                    return date.isBefore(today);
                default:
                    return true;
            }
        }).collect(Collectors.toList());
    }

    @Transactional
    public PredictedExpense updateExpenseStatus(Long id, ExpenseStatus newStatus) {
        PredictedExpense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found with ID: " + id));
        expense.setStatus(newStatus);
        log.info("Updated expense ID {} status to {}", id, newStatus);
        return expenseRepository.save(expense);
    }

    @Transactional(readOnly = true)
    public ExpenseSummaryDto getSummary() {
        return getSummaryForWorkspace(null, null);
    }

    @Transactional(readOnly = true)
    public ExpenseSummaryDto getSummaryForWorkspace(Long workspaceId) {
        return getSummaryForWorkspace(workspaceId, null);
    }

    @Transactional(readOnly = true)
    public ExpenseSummaryDto getSummaryForWorkspace(Long workspaceId, String timeframe) {
        List<PredictedExpense> filtered = getExpensesForWorkspace(workspaceId, timeframe);

        BigDecimal totalSpend = BigDecimal.ZERO;
        long highConfidenceCount = 0;
        BigDecimal highConfidenceSpend = BigDecimal.ZERO;
        long pendingReviewCount = 0;
        BigDecimal pendingReviewSpend = BigDecimal.ZERO;
        long approvedCount = 0;
        BigDecimal approvedSpend = BigDecimal.ZERO;

        for (PredictedExpense exp : filtered) {
            BigDecimal amt = exp.getEstimatedAmount() != null ? exp.getEstimatedAmount() : BigDecimal.ZERO;
            totalSpend = totalSpend.add(amt);

            if (exp.getConfidenceScore() != null && exp.getConfidenceScore() >= 80) {
                highConfidenceCount++;
                highConfidenceSpend = highConfidenceSpend.add(amt);
            }

            if (exp.getStatus() == ExpenseStatus.PENDING) {
                pendingReviewCount++;
                pendingReviewSpend = pendingReviewSpend.add(amt);
            } else if (exp.getStatus() == ExpenseStatus.APPROVED) {
                approvedCount++;
                approvedSpend = approvedSpend.add(amt);
            }
        }

        return ExpenseSummaryDto.builder()
                .totalPredictedSpend(totalSpend)
                .totalExpensesCount(filtered.size())
                .highConfidenceCount(highConfidenceCount)
                .highConfidenceSpend(highConfidenceSpend)
                .pendingReviewCount(pendingReviewCount)
                .pendingReviewSpend(pendingReviewSpend)
                .approvedCount(approvedCount)
                .approvedSpend(approvedSpend)
                .build();
    }
}
