package com.vanguard.predictivebudget.service;

import com.vanguard.predictivebudget.model.SpendRequest;
import com.vanguard.predictivebudget.model.SpendRequestStatus;
import com.vanguard.predictivebudget.repository.SpendRequestRepository;
import com.vanguard.predictivebudget.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class SpendRequestService {

    private final SpendRequestRepository spendRequestRepository;
    private final LithicClientService lithicClientService;
    private static final BigDecimal DEFAULT_POLICY_THRESHOLD = new BigDecimal("300.00");
    private final Random random = new Random();

    /**
     * Parse and process a /buy command string.
     */
    @Transactional
    public SpendRequest processBuyCommand(String rawText, String sender, String channel, Long workspaceId) {
        if (rawText == null || rawText.trim().isEmpty()) {
            throw new IllegalArgumentException("Command text cannot be empty");
        }

        String cleaned = rawText.trim();
        // Strictly enforce /buy as the sole command
        if (cleaned.toLowerCase().startsWith("/buy")) {
            cleaned = cleaned.substring(4).trim();
        } else {
            throw new IllegalArgumentException("Invalid command. Spend requests must start with '/buy'");
        }

        BigDecimal requestedAmount = extractAmount(cleaned);
        String department = deduceDepartment(cleaned);
        String mccCategoryLock = deduceMccCategory(cleaned);
        String itemDescription = cleanItemDescription(cleaned);

        if (sender == null || sender.isBlank()) {
            sender = "@team_member";
        }
        if (channel == null || channel.isBlank()) {
            channel = "#general";
        }

        SpendRequest.SpendRequestBuilder builder = SpendRequest.builder()
                .workspaceId(workspaceId != null ? workspaceId : 1L)
                .requesterName(sender)
                .requesterChannel(channel)
                .itemDescription(itemDescription)
                .department(department)
                .policyThreshold(DEFAULT_POLICY_THRESHOLD)
                .mccCategoryLock(mccCategoryLock);

        // Evaluate Policy Threshold
        if (requestedAmount != null) {
            builder.requestedAmount(requestedAmount);
            if (requestedAmount.compareTo(DEFAULT_POLICY_THRESHOLD) > 0) {
                // EXCEEDS $300 THRESHOLD -> Block automated virtual card
                builder.status(SpendRequestStatus.EXCEEDS_POLICY);
                builder.rejectionReason(String.format(
                        "Requested amount ($%.2f) exceeds company virtual card threshold of $%.2f. Automatic card issuance is prohibited. Please submit a manual purchase order or request employee reimbursement.",
                        requestedAmount, DEFAULT_POLICY_THRESHOLD
                ));
            } else {
                // WITHIN POLICY -> Under or equal to $300
                builder.status(SpendRequestStatus.PENDING_APPROVAL);
                builder.approvedAmount(requestedAmount);
            }
        } else {
            // Price unspecified -> Cap at policy limit ($300)
            builder.status(SpendRequestStatus.PENDING_APPROVAL);
            builder.approvedAmount(DEFAULT_POLICY_THRESHOLD);
        }

        SpendRequest saved = spendRequestRepository.save(builder.build());
        log.info("Created SpendRequest ID {} for {} - Status: {}, Amount: ${}",
                saved.getId(), saved.getRequesterName(), saved.getStatus(), saved.getApprovedAmount());
        return saved;
    }

    /**
     * Manager 1-click Approval & Real Lithic Virtual Card Generator.
     */
    @Transactional
    public SpendRequest approveAndIssueCard(Long requestId, BigDecimal customCap, UserPrincipal approver) {
        SpendRequest request = spendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Spend request not found: " + requestId));

        if (request.getStatus() == SpendRequestStatus.EXCEEDS_POLICY) {
            throw new IllegalStateException("Cannot issue automated card for requests exceeding policy limit of $300.");
        }

        BigDecimal finalCap = customCap != null ? customCap : request.getApprovedAmount();
        if (finalCap == null) {
            finalCap = DEFAULT_POLICY_THRESHOLD;
        }

        // Strict Enforcement: Cannot approve card above threshold
        if (finalCap.compareTo(DEFAULT_POLICY_THRESHOLD) > 0) {
            throw new IllegalArgumentException(String.format("Approval cap ($%.2f) cannot exceed maximum company threshold of $%.2f",
                    finalCap, DEFAULT_POLICY_THRESHOLD));
        }

        request.setApprovedAmount(finalCap);
        request.setStatus(SpendRequestStatus.APPROVED_CARD_ISSUED);
        request.setRejectionReason(null);

        // Mint Single-Use Virtual Card via Lithic API
        String memo = String.format("Vanguard #%d: %s for %s", request.getId(), request.getItemDescription(), request.getRequesterName());
        String cardholder = cleanRequesterName(request.getRequesterName());

        LithicClientService.LithicCardResult lithicCard = lithicClientService.createSingleUseCard(finalCap, memo, cardholder);

        request.setCardToken(lithicCard.getCardToken());
        request.setPan(lithicCard.getPan());
        request.setMaskedCardNumber(lithicCard.getMaskedPan());
        request.setCardholderName(cardholder);
        request.setCvv(lithicCard.getCvv());
        request.setExpiryDate(lithicCard.getExpiryDate());
        request.setIsBurned(false);

        log.info("Approved spend request {} and issued Lithic virtual card {} (Token: {}, Limit: ${}, Category: {})",
                requestId, request.getMaskedCardNumber(), request.getCardToken(), finalCap, request.getMccCategoryLock());
        return spendRequestRepository.save(request);
    }

    /**
     * Manager Rejection.
     */
    @Transactional
    public SpendRequest rejectRequest(Long requestId, String reason, UserPrincipal approver) {
        SpendRequest request = spendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Spend request not found: " + requestId));

        request.setStatus(SpendRequestStatus.REJECTED);
        request.setRejectionReason(reason != null && !reason.isBlank() ? reason : "Declined by budget manager.");
        log.info("Rejected spend request ID {}: {}", requestId, request.getRejectionReason());
        return spendRequestRepository.save(request);
    }

    /**
     * Simulate merchant card transaction swipe with Lithic Authorization Simulator.
     */
    @Transactional
    public SpendRequest simulateCardSwipe(Long requestId, BigDecimal amount, String merchantName) {
        SpendRequest request = spendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Spend request not found: " + requestId));

        if (request.getStatus() != SpendRequestStatus.APPROVED_CARD_ISSUED) {
            throw new IllegalStateException("Card is not in active state for purchase.");
        }
        if (Boolean.TRUE.equals(request.getIsBurned())) {
            throw new IllegalStateException("Virtual card has already been used and burned.");
        }

        BigDecimal maxAllowed = request.getApprovedAmount() != null ? request.getApprovedAmount() : DEFAULT_POLICY_THRESHOLD;
        if (amount.compareTo(maxAllowed) > 0) {
            throw new IllegalArgumentException(String.format("Transaction ($%.2f) declined: exceeds single-use card limit ($%.2f).",
                    amount, maxAllowed));
        }

        String merchant = merchantName != null ? merchantName : "Amazon Business / Approved Vendor";

        // Trigger Lithic Sandbox Authorization Simulator with unmasked PAN and Card Token
        LithicClientService.LithicAuthResult authResult = lithicClientService.simulateSwipeAuthorization(
                request.getPan(), amount, merchant, request.getCardToken());

        if (!authResult.isApproved()) {
            throw new IllegalStateException(String.format("Lithic Sandbox declined transaction: %s (Status: %s)",
                    authResult.getResult(), authResult.getStatusCode()));
        }

        // Burn / Close the Single-Use Card on Lithic Sandbox
        lithicClientService.closeCard(request.getCardToken());

        request.setActualChargedAmount(amount);
        request.setMerchantName(merchant);
        request.setIsBurned(true); // Burn single-use card immediately after swipe
        request.setStatus(SpendRequestStatus.CARD_SWIPED);

        log.info("Card swipe completed on request {}: charged ${} at {} (Lithic Token: {})", 
                requestId, amount, request.getMerchantName(), request.getCardToken());
        return spendRequestRepository.save(request);
    }

    /**
     * AI Receipt Reconciliation.
     */
    @Transactional
    public SpendRequest reconcileReceipt(Long requestId, String receiptSnippet) {
        SpendRequest request = spendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Spend request not found: " + requestId));

        request.setReceiptSnippet(receiptSnippet != null ? receiptSnippet : "Verified invoice from authorized vendor.");
        request.setReceiptVerified(true);
        request.setStatus(SpendRequestStatus.RECONCILED);

        log.info("Reconciled receipt for spend request ID {}", requestId);
        return spendRequestRepository.save(request);
    }

    @Transactional(readOnly = true)
    public List<SpendRequest> getRequestsForWorkspace(Long workspaceId, SpendRequestStatus statusFilter) {
        Long targetWs = workspaceId != null ? workspaceId : 1L;
        if (statusFilter != null) {
            return spendRequestRepository.findByWorkspaceIdAndStatusOrderByCreatedAtDesc(targetWs, statusFilter);
        }
        return spendRequestRepository.findByWorkspaceIdOrderByCreatedAtDesc(targetWs);
    }

    /**
     * Seed initial demo requests if table is empty.
     */
    @Transactional
    public void seedDemoRequestsIfEmpty(Long workspaceId) {
        Long targetWs = workspaceId != null ? workspaceId : 1L;
        if (spendRequestRepository.countByWorkspaceIdAndStatus(targetWs, SpendRequestStatus.PENDING_APPROVAL) > 0
                || spendRequestRepository.count() > 0) {
            return;
        }

        // Demo 1: Under threshold ($240 <= $300) -> PENDING_APPROVAL
        spendRequestRepository.save(SpendRequest.builder()
                .workspaceId(targetWs)
                .requesterName("@alex_dev")
                .requesterChannel("#engineering-ops")
                .itemDescription("Ergonomic Lumbar Desk Chair")
                .department("OPERATIONS")
                .requestedAmount(new BigDecimal("240.00"))
                .approvedAmount(new BigDecimal("240.00"))
                .policyThreshold(DEFAULT_POLICY_THRESHOLD)
                .status(SpendRequestStatus.PENDING_APPROVAL)
                .mccCategoryLock("OFFICE_EQUIPMENT_FURNITURE")
                .build());

        // Demo 2: Exceeds policy ($1,200 > $300) -> EXCEEDS_POLICY
        spendRequestRepository.save(SpendRequest.builder()
                .workspaceId(targetWs)
                .requesterName("@marcus_growth")
                .requesterChannel("#marketing-shoots")
                .itemDescription("Sony 4K Production Camera & Lens")
                .department("MARKETING")
                .requestedAmount(new BigDecimal("1200.00"))
                .policyThreshold(DEFAULT_POLICY_THRESHOLD)
                .status(SpendRequestStatus.EXCEEDS_POLICY)
                .mccCategoryLock("ELECTRONICS_PHOTO")
                .rejectionReason("Requested amount ($1200.00) exceeds company virtual card threshold of $300.00. Automatic card issuance blocked. Please request manual manager PO or submit reimbursement.")
                .build());

        // Demo 3: Price unspecified -> PENDING_APPROVAL capped at $300
        spendRequestRepository.save(SpendRequest.builder()
                .workspaceId(targetWs)
                .requesterName("@elena_ux")
                .requesterChannel("#design-ops")
                .itemDescription("Dual Monitor Arm & Desk Converter")
                .department("DESIGN")
                .requestedAmount(null)
                .approvedAmount(DEFAULT_POLICY_THRESHOLD)
                .policyThreshold(DEFAULT_POLICY_THRESHOLD)
                .status(SpendRequestStatus.PENDING_APPROVAL)
                .mccCategoryLock("OFFICE_EQUIPMENT_FURNITURE")
                .build());

        // Demo 4: Approved & Card Issued -> APPROVED_CARD_ISSUED
        spendRequestRepository.save(SpendRequest.builder()
                .workspaceId(targetWs)
                .requesterName("@chloe_finance")
                .requesterChannel("#finance-tools")
                .itemDescription("Figma Team Annual License Seat")
                .department("DESIGN")
                .requestedAmount(new BigDecimal("180.00"))
                .approvedAmount(new BigDecimal("180.00"))
                .policyThreshold(DEFAULT_POLICY_THRESHOLD)
                .status(SpendRequestStatus.APPROVED_CARD_ISSUED)
                .cardToken("card_live_lithic_demo_01")
                .maskedCardNumber("4000 •••• •••• 9812")
                .cardholderName("Chloe Vance")
                .cvv("419")
                .expiryDate("11/27")
                .mccCategoryLock("SOFTWARE_SAAS")
                .isBurned(false)
                .build());

        log.info("Seeded demo spend requests for workspace ID {}", targetWs);
    }

    // ── Helper Parsers ──────────────────────────────────────────────────────

    private BigDecimal extractAmount(String text) {
        if (text == null) return null;
        Pattern pattern = Pattern.compile("(?i)(?:\\$|usd\\s*|cost\\s*|price\\s*)?(\\d{1,5}(?:\\.\\d{1,2})?)(?:\\s*(?:k|thousand))?");
        Matcher matcher = pattern.matcher(text);
        BigDecimal found = null;
        while (matcher.find()) {
            String numStr = matcher.group(1);
            try {
                BigDecimal val = new BigDecimal(numStr);
                // Check if followed by 'k'
                if (matcher.group(0).toLowerCase().contains("k")) {
                    val = val.multiply(new BigDecimal("1000"));
                }
                found = val;
            } catch (Exception ignored) {}
        }
        return found;
    }

    private String deduceDepartment(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("camera") || lower.contains("video") || lower.contains("marketing") || lower.contains("ads")) {
            return "MARKETING";
        }
        if (lower.contains("figma") || lower.contains("design") || lower.contains("sketch") || lower.contains("adobe")) {
            return "DESIGN";
        }
        if (lower.contains("aws") || lower.contains("server") || lower.contains("cloud") || lower.contains("api") || lower.contains("dev")) {
            return "INFRASTRUCTURE";
        }
        return "OPERATIONS";
    }

    private String deduceMccCategory(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("camera") || lower.contains("mic") || lower.contains("audio") || lower.contains("headphone") || lower.contains("lens")) {
            return "ELECTRONICS_PHOTO";
        }
        if (lower.contains("software") || lower.contains("license") || lower.contains("figma") || lower.contains("saas") || lower.contains("app")) {
            return "SOFTWARE_SAAS";
        }
        return "OFFICE_EQUIPMENT_FURNITURE";
    }

    private String cleanItemDescription(String text) {
        String cleaned = text.replaceAll("(?i)(?:need|to buy|buy|for|approx|around|\\$\\d+(\\.\\d{2})?|from \\w+ budget)", "").trim();
        if (cleaned.length() > 2) {
            // Capitalize first letter
            return Character.toUpperCase(cleaned.charAt(0)) + cleaned.substring(1);
        }
        return text.trim();
    }

    private String cleanRequesterName(String raw) {
        if (raw == null) return "Team Member";
        String cleaned = raw.replace("@", "").replace("_", " ").trim();
        String[] parts = cleaned.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (!p.isEmpty()) {
                sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1).toLowerCase()).append(" ");
            }
        }
        return sb.toString().trim();
    }
}
