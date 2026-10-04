package com.vanguard.predictivebudget.controller;

import com.vanguard.predictivebudget.model.RawMessage;
import com.vanguard.predictivebudget.model.Workspace;
import com.vanguard.predictivebudget.repository.RawMessageRepository;
import com.vanguard.predictivebudget.repository.WorkspaceRepository;
import com.vanguard.predictivebudget.security.UserPrincipal;
import com.vanguard.predictivebudget.service.ExpenseExtractionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/integrations/email")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class EmailIngestionController {

    private final RawMessageRepository rawMessageRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ExpenseExtractionService expenseExtractionService;

    /**
     * Ingests vendor quote or capacity expansion emails for the caller's workspace.
     */
    @PostMapping
    public ResponseEntity<?> ingestEmail(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;
        return processIncomingEmail(payload, workspaceId);
    }

    /**
     * Public inbound webhook endpoint for email forwarding services (SendGrid, Cloudflare, Postmark, AWS SES).
     * Supports slug in path: /api/integrations/email/inbound/{slug}
     */
    @PostMapping(value = "/inbound/{slug}", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public ResponseEntity<?> ingestInboundEmailWebhookWithSlug(
            @PathVariable String slug,
            @RequestParam(required = false) Map<String, String> formParams,
            @RequestBody(required = false) Map<String, Object> jsonPayload) {
        Map<String, String> payload = mergePayloads(formParams, jsonPayload);
        Long workspaceId = resolveWorkspaceBySlug(slug, payload);
        log.info("Received external email webhook for tenant slug '{}' -> mapped to Workspace ID: {}", slug, workspaceId);
        return processIncomingEmail(payload, workspaceId);
    }

    /**
     * Public catch-all inbound webhook endpoint without slug in path.
     * Automatically extracts tenant slug from the 'to' or 'recipient' address (e.g. inbox-vishal-5813@...).
     */
    @PostMapping(value = "/inbound", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public ResponseEntity<?> ingestInboundEmailWebhookGeneric(
            @RequestParam(required = false) Map<String, String> formParams,
            @RequestBody(required = false) Map<String, Object> jsonPayload) {
        Map<String, String> payload = mergePayloads(formParams, jsonPayload);
        String toAddress = extractField(payload, "to", "To", "recipient");
        String extractedSlug = extractSlugFromAddress(toAddress);
        Long workspaceId = resolveWorkspaceBySlug(extractedSlug, payload);
        log.info("Received catch-all external email webhook to '{}' (slug: '{}') -> mapped to Workspace ID: {}",
                toAddress, extractedSlug, workspaceId);
        return processIncomingEmail(payload, workspaceId);
    }

    private Long resolveWorkspaceBySlug(String slug, Map<String, String> payload) {
        if (slug != null && !slug.trim().isEmpty()) {
            var found = workspaceRepository.findBySlug(slug)
                    .map(Workspace::getId)
                    .or(() -> workspaceRepository.findByInboundEmailSlug(slug).map(Workspace::getId));
            if (found.isPresent()) return found.get();
        }
        return 1L; // default fallback workspace
    }

    private String extractSlugFromAddress(String toAddress) {
        if (toAddress == null) return null;
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("inbox-([a-zA-Z0-9_-]+)@", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(toAddress);
        if (m.find()) return m.group(1);
        return null;
    }

    private Map<String, String> mergePayloads(Map<String, String> formParams, Map<String, Object> jsonPayload) {
        Map<String, String> merged = new HashMap<>();
        if (formParams != null) merged.putAll(formParams);
        if (jsonPayload != null) {
            jsonPayload.forEach((k, v) -> {
                if (v != null) merged.put(k, v.toString());
            });
        }
        return merged;
    }

    private String extractField(Map<String, String> map, String... keys) {
        if (map == null) return null;
        for (String k : keys) {
            if (map.containsKey(k) && map.get(k) != null && !map.get(k).trim().isEmpty()) {
                return map.get(k).trim();
            }
        }
        return null;
    }

    private ResponseEntity<?> processIncomingEmail(Map<String, String> payload, Long workspaceId) {
        String from = extractField(payload, "from", "From", "sender", "sender_email");
        if (from == null) from = "billing@vendor.com";

        String subject = extractField(payload, "subject", "Subject", "title");
        if (subject == null) subject = "Vendor Pricing Proposal";

        String body = extractField(payload, "body", "Body", "text", "TextBody", "plain", "stripped-text", "html", "HtmlBody");
        if (body == null || body.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email body/text cannot be empty"));
        }

        String content = "Subject: " + subject + "\nFrom: " + from + "\n\n" + body;

        RawMessage raw = RawMessage.builder()
                .workspaceId(workspaceId)
                .content(content)
                .sender(from)
                .timestamp(String.valueOf(System.currentTimeMillis() / 1000))
                .sourceType("GMAIL")
                .sourceChannelOrSubject("Email: " + subject)
                .isProcessed(false)
                .build();

        rawMessageRepository.save(raw);
        log.info("Ingested email quote into RawMessage ID {} from {} for Workspace: {}", raw.getId(), from, workspaceId);

        // Detect and store Gmail Forwarding Confirmation Code if received from Google
        if (subject.toLowerCase().contains("confirmation") || body.toLowerCase().contains("confirmation code") || from.toLowerCase().contains("google.com")) {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("(?:confirmation code:\\s*|code:\\s*|verification code:\\s*)([0-9]{6,12})", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(body);
            if (m.find()) {
                String code = m.group(1);
                workspaceRepository.findById(workspaceId).ifPresent(ws -> {
                    ws.setGmailForwardingCode(code);
                    workspaceRepository.save(ws);
                    log.info("Captured Gmail forwarding verification code '{}' for Workspace ID {}", code, workspaceId);
                });
            }
        }

        // Run AI extraction immediately
        try {
            expenseExtractionService.processUnprocessedMessages();
        } catch (Exception e) {
            log.error("AI extraction error after email ingestion: {}", e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "rawMessageId", raw.getId(),
                "workspaceId", workspaceId,
                "subject", subject
        ));
    }

    /**
     * Quick presets for realistic email vendor proposals.
     */
    @GetMapping("/presets")
    public ResponseEntity<List<Map<String, String>>> getEmailPresets() {
        return ResponseEntity.ok(List.of(
                Map.of(
                        "from", "enterprise-accounts@aws.amazon.com",
                        "subject", "AWS S3 Data Lake 60TB Capacity Expansion Proposal",
                        "body", "Hi Sarah, following up on your data engineering team's capacity discussion: reserving 60 TB of S3 Standard storage with Intelligent Tiering will add approximately $1,620/month to your AWS commitment starting next month."
                ),
                Map.of(
                        "from", "sales@datadoghq.com",
                        "subject", "Datadog APM & Log Management Contract Renewal 2026",
                        "body", "Hello Sarah, your Datadog annual infrastructure monitoring subscription expires in 30 days. Based on your current 85-host usage, the renewal estimate comes out to $18,400 paid annually."
                ),
                Map.of(
                        "from", "renewals@figma.com",
                        "subject", "Figma Enterprise Seat True-Up Notification",
                        "body", "Hi Finance Team, your organization has added 12 new Enterprise Design seats this past quarter. Your upcoming true-up invoice due on October 1st is $10,800 ($900/seat/year)."
                )
        ));
    }
}
