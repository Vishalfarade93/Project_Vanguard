package com.vanguard.predictivebudget.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vanguard.predictivebudget.model.RawMessage;
import com.vanguard.predictivebudget.model.Workspace;
import com.vanguard.predictivebudget.repository.RawMessageRepository;
import com.vanguard.predictivebudget.repository.WorkspaceRepository;
import com.vanguard.predictivebudget.service.ExpenseExtractionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/slack")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SlackWebhookController {

    private final RawMessageRepository rawMessageRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ExpenseExtractionService expenseExtractionService;
    private final com.vanguard.predictivebudget.repository.PredictedExpenseRepository predictedExpenseRepository;
    private final com.vanguard.predictivebudget.service.SpendRequestService spendRequestService;
    private final ObjectMapper objectMapper;

    /**
     * Endpoint for Slack Event API payloads.
     * Supports multi-tenant routing via ?workspaceId={id}, ?workspaceSlug={slug},
     * or by matching Slack's team_id to a registered company Workspace.
     */
    @PostMapping(value = "/events", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> handleSlackEvents(
            @RequestBody String rawPayload,
            @RequestParam(required = false) Long workspaceId,
            @RequestParam(required = false) String workspaceSlug) {
        try {
            log.info("Received Slack webhook payload: {}", rawPayload);
            JsonNode rootNode = objectMapper.readTree(rawPayload);

            // 1. Handle Slack URL Verification Challenge
            if (rootNode.has("type") && "url_verification".equals(rootNode.get("type").asText())) {
                String challenge = rootNode.has("challenge") ? rootNode.get("challenge").asText() : "";
                log.info("Handling Slack URL verification challenge: {}", challenge);
                return ResponseEntity.ok(Collections.singletonMap("challenge", challenge));
            }

            // Resolve target workspace (tenant)
            Long targetWorkspaceId = resolveWorkspaceId(workspaceId, workspaceSlug, rootNode);
            log.info("Routing Slack message to Tenant Workspace ID: {}", targetWorkspaceId);

            // 2. Handle Event Callback for chat messages
            if (rootNode.has("event")) {
                JsonNode eventNode = rootNode.get("event");
                String eventType = eventNode.has("type") ? eventNode.get("type").asText() : "";

                if ("message".equalsIgnoreCase(eventType)) {
                    String subtype = eventNode.has("subtype") ? eventNode.get("subtype").asText() : "";

                    if ("message_deleted".equalsIgnoreCase(subtype)) {
                        String deletedTs = eventNode.has("deleted_ts") ? eventNode.get("deleted_ts").asText()
                                : (eventNode.has("previous_message") && eventNode.get("previous_message").has("ts")
                                ? eventNode.get("previous_message").get("ts").asText() : null);
                        String prevText = eventNode.has("previous_message") && eventNode.get("previous_message").has("text")
                                ? eventNode.get("previous_message").get("text").asText() : "";

                        log.info("Processing Slack message_deleted event for deletedTs: '{}', prevText: '{}' on Workspace {}",
                                deletedTs, prevText, targetWorkspaceId);

                        retractPredictedExpensesForDeletedMessage(targetWorkspaceId, deletedTs, prevText);
                        return ResponseEntity.ok(Collections.singletonMap("status", "retracted"));
                    }

                    String content = eventNode.has("text") ? eventNode.get("text").asText() : "";
                    String sender = eventNode.has("user") ? eventNode.get("user").asText()
                            : (eventNode.has("username") ? eventNode.get("username").asText() : "unknown_sender");
                    String timestamp = eventNode.has("ts") ? eventNode.get("ts").asText()
                            : String.valueOf(System.currentTimeMillis());

                    if (!content.trim().isEmpty()) {
                        String channel = eventNode.has("channel") ? eventNode.get("channel").asText() : "#slack";
                        String threadTs = eventNode.has("thread_ts") ? eventNode.get("thread_ts").asText(null) : null;
                        String trimmed = content.trim();

                        // Route /buy commands directly to Spend Request & Virtual Card engine (NOT forecast ledger)
                        if (trimmed.startsWith("/buy")) {
                            log.info("Routing active /buy spend request from {} to SpendRequestService: '{}'", sender, trimmed);
                            spendRequestService.processBuyCommand(trimmed, sender, channel, targetWorkspaceId);
                            return ResponseEntity.ok(Collections.singletonMap("status", "spend_request_created"));
                        }

                        RawMessage rawMessage = RawMessage.builder()
                                .workspaceId(targetWorkspaceId)
                                .content(content)
                                .sender(sender)
                                .timestamp(timestamp)
                                .threadTs(threadTs)
                                .sourceType("SLACK")
                                .sourceChannelOrSubject(channel)
                                .isProcessed(false)
                                .build();

                        rawMessageRepository.save(rawMessage);
                        log.info("Saved new unprocessed RawMessage ID {} from sender: {} in channel: {} for Workspace: {}",
                                rawMessage.getId(), sender, channel, targetWorkspaceId);

                        // Trigger immediate AI extraction for zero-latency real-time updates
                        try {
                            expenseExtractionService.processUnprocessedMessages();
                        } catch (Exception ex) {
                            log.error("Immediate extraction error: {}", ex.getMessage());
                        }
                    }
                }
            } else if (rootNode.has("text")) {
                // Direct simplified simulation payload support: {"text": "...", "sender": "...", "thread_ts": "..."}
                String content = rootNode.get("text").asText();
                String sender = rootNode.has("sender") ? rootNode.get("sender").asText() : "simulated_user";
                String timestamp = String.valueOf(System.currentTimeMillis() / 1000);
                String threadTs = rootNode.has("thread_ts") ? rootNode.get("thread_ts").asText(null)
                        : (rootNode.has("threadTs") ? rootNode.get("threadTs").asText(null) : null);
                String topicKey = rootNode.has("topic_key") ? rootNode.get("topic_key").asText(null)
                        : (rootNode.has("topicKey") ? rootNode.get("topicKey").asText(null) : null);
                String channel = rootNode.has("channel") ? rootNode.get("channel").asText("#general") : "#general";

                RawMessage rawMessage = RawMessage.builder()
                        .workspaceId(targetWorkspaceId)
                        .content(content)
                        .sender(sender)
                        .timestamp(timestamp)
                        .threadTs(threadTs)
                        .topicKey(topicKey)
                        .sourceType("SLACK")
                        .sourceChannelOrSubject(channel)
                        .isProcessed(false)
                        .build();

                rawMessageRepository.save(rawMessage);
                log.info("Saved simulated RawMessage ID {} (thread: {}, topic: {}) for Workspace: {}",
                        rawMessage.getId(), threadTs, topicKey, targetWorkspaceId);

                try {
                    expenseExtractionService.processUnprocessedMessages();
                } catch (Exception ex) {
                    log.error("Immediate extraction error: {}", ex.getMessage());
                }
            }

            return ResponseEntity.ok(Collections.singletonMap("status", "ok"));
        } catch (Exception e) {
            log.error("Error processing Slack webhook: {}", e.getMessage(), e);
            return ResponseEntity.ok(Collections.singletonMap("status", "error"));
        }
    }

    /**
     * Endpoint for native Slack Slash Commands (e.g., /buy two dozens of cups for $110).
     * Slack sends application/x-www-form-urlencoded POST requests.
     */
    @PostMapping(value = {"/slash-command", "/commands"}, consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<?> handleSlackSlashCommand(
            @RequestParam Map<String, String> formData,
            @RequestParam(required = false) Long workspaceId,
            @RequestParam(required = false) String workspaceSlug) {
        try {
            log.info("Received Slack Slash Command form payload: {}", formData);
            String command = formData.getOrDefault("command", "/buy");
            String text = formData.getOrDefault("text", "");
            String user = formData.getOrDefault("user_name", "team_member");
            String channel = formData.getOrDefault("channel_name", "general");
            String teamId = formData.getOrDefault("team_id", "");

            Long targetWorkspaceId = workspaceId != null ? workspaceId : 1L;
            if (workspaceSlug != null && !workspaceSlug.isBlank()) {
                targetWorkspaceId = workspaceRepository.findBySlug(workspaceSlug.trim())
                        .map(Workspace::getId).orElse(targetWorkspaceId);
            } else if (!teamId.isBlank()) {
                targetWorkspaceId = workspaceRepository.findBySlackTeamId(teamId)
                        .map(Workspace::getId).orElse(targetWorkspaceId);
            }

            String fullText = command + " " + text;
            com.vanguard.predictivebudget.model.SpendRequest req = spendRequestService.processBuyCommand(
                    fullText, "@" + user, "#" + channel, targetWorkspaceId);

            Map<String, Object> slackResponse = new java.util.HashMap<>();
            slackResponse.put("response_type", "in_channel");
            slackResponse.put("text", String.format(
                    "💳 *Vanguard Spend Request Submitted*\n• *Item:* %s\n• *Amount:* $%.2f\n• *Department:* %s\n• *Status:* %s\n• *Policy Cap:* $%.2f (MCC Category: `%s`)\n_Manager approval requested. Virtual card will be issued automatically upon approval._",
                    req.getItemDescription(),
                    req.getRequestedAmount() != null ? req.getRequestedAmount() : req.getPolicyThreshold(),
                    req.getDepartment(),
                    req.getStatus(),
                    req.getPolicyThreshold(),
                    req.getMccCategoryLock()
            ));

            return ResponseEntity.ok(slackResponse);
        } catch (Exception e) {
            log.error("Error processing Slack slash command: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("response_type", "ephemeral", "text", "⚠️ Vanguard Error: " + e.getMessage()));
        }
    }

    private Long resolveWorkspaceId(Long queryWorkspaceId, String queryWorkspaceSlug, JsonNode rootNode) {
        if (queryWorkspaceId != null && queryWorkspaceId > 0) {
            return queryWorkspaceId;
        }

        if (queryWorkspaceSlug != null && !queryWorkspaceSlug.trim().isEmpty()) {
            return workspaceRepository.findBySlug(queryWorkspaceSlug.trim())
                    .map(Workspace::getId)
                    .orElse(1L);
        }

        // Match by Slack's team_id field in payload
        String teamId = rootNode.path("team_id").asText();
        if (teamId.isEmpty() && rootNode.has("event")) {
            teamId = rootNode.path("event").path("team").asText();
        }

        if (!teamId.isEmpty()) {
            return workspaceRepository.findBySlackTeamId(teamId)
                    .map(Workspace::getId)
                    .orElse(1L);
        }

        return 1L;
    }

    private void retractPredictedExpensesForDeletedMessage(Long workspaceId, String deletedTs, String prevText) {
        List<com.vanguard.predictivebudget.model.PredictedExpense> pending = predictedExpenseRepository.findByWorkspaceIdAndStatus(workspaceId, com.vanguard.predictivebudget.model.ExpenseStatus.PENDING);
        for (com.vanguard.predictivebudget.model.PredictedExpense exp : pending) {
            boolean match = false;
            if (deletedTs != null && !deletedTs.isEmpty() && (deletedTs.equals(exp.getThreadTs()) || deletedTs.equals(exp.getTopicKey()))) {
                match = true;
            }
            if (!match && prevText != null && !prevText.trim().isEmpty()) {
                String cleanPrev = prevText.trim().toLowerCase();
                if (exp.getRawSnippet() != null && (exp.getRawSnippet().toLowerCase().contains(cleanPrev) || cleanPrev.contains(exp.getRawSnippet().toLowerCase()))) {
                    match = true;
                }
                if (!match && exp.getItemDescription() != null && cleanPrev.contains(exp.getItemDescription().toLowerCase())) {
                    match = true;
                }
            }
            if (match) {
                exp.setStatus(com.vanguard.predictivebudget.model.ExpenseStatus.RETRACTED);
                exp.setAiReasoning((exp.getAiReasoning() != null ? exp.getAiReasoning() + "\n" : "") + "[RETRACTED]: Source Slack message was deleted.");
                predictedExpenseRepository.save(exp);
                log.info("Soft-retracted PredictedExpense ID {} ('{}') because source Slack message was deleted.", exp.getId(), exp.getItemDescription());
            }
        }
    }
}
