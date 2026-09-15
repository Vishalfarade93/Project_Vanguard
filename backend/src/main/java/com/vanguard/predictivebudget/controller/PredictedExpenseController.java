package com.vanguard.predictivebudget.controller;

import com.vanguard.predictivebudget.dto.ExpenseSummaryDto;
import com.vanguard.predictivebudget.dto.StatusUpdateRequest;
import com.vanguard.predictivebudget.model.ExpenseStatus;
import com.vanguard.predictivebudget.model.PredictedExpense;
import com.vanguard.predictivebudget.model.RawMessage;
import com.vanguard.predictivebudget.repository.RawMessageRepository;
import com.vanguard.predictivebudget.service.ExpenseExtractionService;
import com.vanguard.predictivebudget.service.PredictedExpenseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.vanguard.predictivebudget.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PredictedExpenseController {

    private final PredictedExpenseService expenseService;
    private final ExpenseExtractionService extractionService;
    private final RawMessageRepository rawMessageRepository;

    /**
     * Standard endpoint to fetch predicted expenses scoped to the caller's workspace.
     * Supports timeframe filtering: 7d, 30d, 90d, future, history, all.
     */
    @GetMapping
    public ResponseEntity<List<PredictedExpense>> getAllExpenses(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String timeframe) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : null;
        List<PredictedExpense> expenses = expenseService.getExpensesForWorkspace(workspaceId, timeframe);
        return ResponseEntity.ok(expenses);
    }

    /**
     * Summary metrics for dashboard top cards scoped to the caller's workspace and timeframe.
     */
    @GetMapping("/summary")
    public ResponseEntity<ExpenseSummaryDto> getSummary(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String timeframe) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : null;
        return ResponseEntity.ok(expenseService.getSummaryForWorkspace(workspaceId, timeframe));
    }

    /**
     * Department budget metrics and capacity thresholds scoped to the caller's workspace.
     */
    @GetMapping("/department-budgets")
    public ResponseEntity<List<Map<String, Object>>> getDepartmentBudgets(@AuthenticationPrincipal UserPrincipal principal) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : null;
        List<PredictedExpense> expenses = expenseService.getExpensesForWorkspace(workspaceId);

        Map<String, BigDecimal> allocatedCaps = Map.of(
                "INFRASTRUCTURE", new BigDecimal("25000.00"),
                "DATA_PLATFORM", new BigDecimal("20000.00"),
                "CONTRACTORS", new BigDecimal("15000.00"),
                "ENGINEERING_TOOLS", new BigDecimal("10000.00"),
                "DESIGN", new BigDecimal("8000.00")
        );

        Map<String, BigDecimal> actualSpent = new java.util.HashMap<>();
        for (String dept : allocatedCaps.keySet()) {
            actualSpent.put(dept, BigDecimal.ZERO);
        }

        for (PredictedExpense exp : expenses) {
            String dept = exp.getDepartment() != null ? exp.getDepartment() : "INFRASTRUCTURE";
            BigDecimal amt = exp.getEstimatedAmount() != null ? exp.getEstimatedAmount() : BigDecimal.ZERO;
            actualSpent.put(dept, actualSpent.getOrDefault(dept, BigDecimal.ZERO).add(amt));
        }

        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : allocatedCaps.entrySet()) {
            String dept = entry.getKey();
            BigDecimal cap = entry.getValue();
            BigDecimal spent = actualSpent.getOrDefault(dept, BigDecimal.ZERO);
            double percent = cap.compareTo(BigDecimal.ZERO) > 0
                    ? spent.divide(cap, 4, java.math.RoundingMode.HALF_UP).doubleValue() * 100.0
                    : 0.0;

            result.add(Map.of(
                    "department", dept,
                    "budgetLimit", cap,
                    "predictedSpend", spent,
                    "percentUsed", Math.min(100.0, Math.round(percent * 10.0) / 10.0),
                    "isWarning", percent >= 80.0
            ));
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Approve or reject a predicted expense.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateExpenseStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest request) {
        if (request.getStatus() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status cannot be null"));
        }
        try {
            PredictedExpense updated = expenseService.updateExpenseStatus(id, request.getStatus());
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Immediate trigger for AI extraction of all pending raw messages.
     */
    @PostMapping("/extract")
    public ResponseEntity<?> triggerExtraction() {
        int extracted = extractionService.processUnprocessedMessages();
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "extractedCount", extracted,
                "message", "AI extraction completed. Extracted " + extracted + " new expenses."
        ));
    }

    /**
     * Endpoint to fetch raw messages for diagnostic and simulator visibility.
     */
    @GetMapping("/messages")
    public ResponseEntity<List<RawMessage>> getRawMessages() {
        return ResponseEntity.ok(rawMessageRepository.findAll());
    }
}
