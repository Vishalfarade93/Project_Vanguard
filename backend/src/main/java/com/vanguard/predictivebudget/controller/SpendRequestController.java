package com.vanguard.predictivebudget.controller;

import com.vanguard.predictivebudget.model.SpendRequest;
import com.vanguard.predictivebudget.model.SpendRequestStatus;
import com.vanguard.predictivebudget.security.UserPrincipal;
import com.vanguard.predictivebudget.service.SpendRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/spend-requests")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SpendRequestController {

    private final SpendRequestService spendRequestService;

    /**
     * Get all spend requests for the caller's workspace with optional status filter.
     */
    @GetMapping
    public ResponseEntity<List<SpendRequest>> getSpendRequests(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) SpendRequestStatus status) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;
        spendRequestService.seedDemoRequestsIfEmpty(workspaceId);
        List<SpendRequest> requests = spendRequestService.getRequestsForWorkspace(workspaceId, status);
        return ResponseEntity.ok(requests);
    }

    /**
     * Submit a /buy command (from Slack webhook or dashboard simulator).
     */
    @PostMapping("/command")
    public ResponseEntity<?> submitBuyCommand(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> payload) {
        String text = payload.get("text");
        if (text == null || text.isBlank()) {
            text = payload.get("command");
        }
        String sender = payload.getOrDefault("sender", principal != null ? principal.getEmail() : "@team_member");
        String channel = payload.getOrDefault("channel", "#procurement");
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;

        try {
            SpendRequest request = spendRequestService.processBuyCommand(text, sender, channel, workspaceId);
            return ResponseEntity.ok(request);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Manager 1-click Approval & Virtual Card Generator.
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) Map<String, Object> payload) {
        BigDecimal customCap = null;
        if (payload != null && payload.containsKey("customCap") && payload.get("customCap") != null) {
            customCap = new BigDecimal(payload.get("customCap").toString());
        }

        try {
            SpendRequest approved = spendRequestService.approveAndIssueCard(id, customCap, principal);
            return ResponseEntity.ok(approved);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Manager Rejection.
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) Map<String, String> payload) {
        String reason = payload != null ? payload.get("reason") : "Declined by budget manager";
        try {
            SpendRequest rejected = spendRequestService.rejectRequest(id, reason, principal);
            return ResponseEntity.ok(rejected);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Simulate merchant card transaction swipe.
     */
    @PostMapping("/{id}/simulate-swipe")
    public ResponseEntity<?> simulateCardSwipe(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        if (!payload.containsKey("amount") || payload.get("amount") == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Amount is required for card swipe."));
        }
        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        String merchant = payload.containsKey("merchantName") && payload.get("merchantName") != null
                ? payload.get("merchantName").toString()
                : "Authorized Vendor / Amazon";

        try {
            SpendRequest updated = spendRequestService.simulateCardSwipe(id, amount, merchant);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Post-purchase AI Receipt Reconciliation.
     */
    @PostMapping("/{id}/reconcile")
    public ResponseEntity<?> reconcileReceipt(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String snippet = payload.getOrDefault("receiptSnippet", "Verified merchant invoice receipt.");
        try {
            SpendRequest reconciled = spendRequestService.reconcileReceipt(id, snippet);
            return ResponseEntity.ok(reconciled);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
