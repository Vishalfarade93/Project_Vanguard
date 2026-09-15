package com.vanguard.predictivebudget.controller;

import com.vanguard.predictivebudget.model.Workspace;
import com.vanguard.predictivebudget.repository.WorkspaceRepository;
import com.vanguard.predictivebudget.security.UserPrincipal;
import com.vanguard.predictivebudget.service.SlackClientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/integrations/slack")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SlackIntegrationController {

    private final SlackClientService slackClientService;
    private final WorkspaceRepository workspaceRepository;

    /**
     * Returns the tenant workspace's current integration status (Slack connection, monitored channels, inbound email).
     */
    @GetMapping("/status")
    public ResponseEntity<?> getIntegrationStatus(@AuthenticationPrincipal UserPrincipal principal) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;
        Optional<Workspace> wsOpt = workspaceRepository.findById(workspaceId);

        if (wsOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Workspace ws = wsOpt.get();
        boolean isConnected = ws.getSlackToken() != null && !ws.getSlackToken().trim().isEmpty();

        List<String> channelsList = new ArrayList<>();
        if (ws.getMonitoredChannels() != null && !ws.getMonitoredChannels().trim().isEmpty()) {
            for (String ch : ws.getMonitoredChannels().split(",")) {
                String clean = ch.trim();
                if (!clean.isEmpty()) channelsList.add(clean);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("workspaceId", ws.getId());
        response.put("workspaceName", ws.getName());
        response.put("workspaceSlug", ws.getSlug());
        response.put("slackConnected", isConnected);
        response.put("slackTeamId", ws.getSlackTeamId());
        response.put("slackBotName", ws.getSlackBotName() != null ? ws.getSlackBotName() : "vanguard_budget_bot");
        response.put("monitoredChannels", channelsList);
        response.put("inboundEmailSlug", ws.getInboundEmailSlug() != null ? ws.getInboundEmailSlug() : ws.getSlug());
        response.put("webhookUrl", "/api/slack/events?workspaceId=" + ws.getId());

        return ResponseEntity.ok(response);
    }

    /**
     * Authenticates with Slack API using Bot Token (xoxb-...) via auth.test.
     * Persists token and team metadata directly to the authenticated tenant's Workspace.
     */
    @PostMapping("/connect")
    public ResponseEntity<?> connectSlackWorkspace(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal principal) {
        String token = payload.getOrDefault("token", "");
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;

        log.info("Testing Slack connection for workspace {} with token prefix {}",
                workspaceId, token.length() > 8 ? token.substring(0, 8) + "..." : "none");

        Map<String, Object> authResult = slackClientService.testSlackAuth(token);
        if (Boolean.TRUE.equals(authResult.get("ok"))) {
            // Persist to Workspace
            workspaceRepository.findById(workspaceId).ifPresent(ws -> {
                ws.setSlackToken(token.trim());
                if (authResult.containsKey("teamId")) {
                    ws.setSlackTeamId((String) authResult.get("teamId"));
                }
                if (authResult.containsKey("user")) {
                    ws.setSlackBotName((String) authResult.get("user"));
                }
                workspaceRepository.save(ws);
                log.info("Persisted Slack credentials to Workspace ID: {}", ws.getId());
            });

            return ResponseEntity.ok(authResult);
        } else {
            return ResponseEntity.badRequest().body(authResult);
        }
    }

    /**
     * Disconnects and removes Slack credentials from the authenticated tenant's Workspace.
     */
    @PostMapping("/disconnect")
    public ResponseEntity<?> disconnectSlack(@AuthenticationPrincipal UserPrincipal principal) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;
        workspaceRepository.findById(workspaceId).ifPresent(ws -> {
            ws.setSlackToken(null);
            ws.setSlackTeamId(null);
            ws.setSlackBotName(null);
            workspaceRepository.save(ws);
            log.info("Disconnected Slack from Workspace ID: {}", ws.getId());
        });
        return ResponseEntity.ok(Map.of("status", "disconnected"));
    }

    /**
     * Lists accessible public & private Slack channels using the provided or saved Bot Token.
     */
    @GetMapping("/channels")
    public ResponseEntity<List<Map<String, String>>> listChannels(
            @RequestParam(required = false, defaultValue = "") String token,
            @AuthenticationPrincipal UserPrincipal principal) {

        String effectiveToken = token;
        if ((effectiveToken == null || effectiveToken.trim().isEmpty()) && principal != null) {
            Workspace ws = workspaceRepository.findById(principal.getWorkspaceId()).orElse(null);
            if (ws != null && ws.getSlackToken() != null) {
                effectiveToken = ws.getSlackToken();
            }
        }

        List<Map<String, String>> channels = slackClientService.listSlackChannels(effectiveToken);
        return ResponseEntity.ok(channels);
    }

    /**
     * Saves selected monitored channels for the authenticated tenant's Workspace.
     */
    @PostMapping("/save-channels")
    public ResponseEntity<?> saveMonitoredChannels(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;
        List<String> channels = (List<String>) payload.get("channels");

        if (channels != null) {
            workspaceRepository.findById(workspaceId).ifPresent(ws -> {
                ws.setMonitoredChannels(String.join(", ", channels));
                workspaceRepository.save(ws);
                log.info("Updated monitored channels for Workspace {}: {}", ws.getId(), channels);

                // Auto-join public channels using bot token
                if (ws.getSlackToken() != null && !ws.getSlackToken().startsWith("xoxb-demo")) {
                    List<Map<String, String>> allChannels = slackClientService.listSlackChannels(ws.getSlackToken());
                    for (String chName : channels) {
                        for (Map<String, String> c : allChannels) {
                            String name = c.get("name");
                            if (name != null && (name.equalsIgnoreCase(chName) || name.replace("#", "").equalsIgnoreCase(chName.replace("#", "")))) {
                                String id = c.get("id");
                                if (id != null && !id.startsWith("C_")) {
                                    slackClientService.joinSlackChannel(ws.getSlackToken(), id);
                                }
                                break;
                            }
                        }
                    }
                }
            });
        }

        return ResponseEntity.ok(Map.of("status", "success", "channels", channels != null ? channels : List.of()));
    }

    /**
     * Scrapes conversation history from a specific Slack channel for the tenant's workspace.
     */
    @PostMapping("/scrape")
    public ResponseEntity<?> scrapeChannelHistory(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;
        String token = (String) payload.getOrDefault("token", "");
        String channelId = (String) payload.getOrDefault("channelId", "C_INFRA_01");
        String channelName = (String) payload.getOrDefault("channelName", "#infrastructure-cloud");
        int limit = payload.containsKey("limit") ? (int) payload.get("limit") : 25;

        if ((token == null || token.trim().isEmpty()) && principal != null) {
            Workspace ws = workspaceRepository.findById(workspaceId).orElse(null);
            if (ws != null && ws.getSlackToken() != null) {
                token = ws.getSlackToken();
            }
        }

        log.info("Scraping channel {} (ID: {}) for workspace {}", channelName, channelId, workspaceId);
        Map<String, Object> result = slackClientService.scrapeChannelHistory(workspaceId, token, channelId, channelName, limit);
        return ResponseEntity.ok(result);
    }

    /**
     * Synchronizes messages across multiple selected Slack channels for the tenant's workspace and runs AI extraction.
     */
    @PostMapping("/sync")
    public ResponseEntity<?> syncChannels(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;
        String token = (String) payload.getOrDefault("token", "");
        List<Map<String, String>> channels = (List<Map<String, String>>) payload.get("channels");
        int limitPerChannel = payload.containsKey("limit") ? (int) payload.get("limit") : 20;

        if ((token == null || token.trim().isEmpty()) && principal != null) {
            Workspace ws = workspaceRepository.findById(workspaceId).orElse(null);
            if (ws != null && ws.getSlackToken() != null) {
                token = ws.getSlackToken();
            }
        }

        log.info("Starting multi-channel Slack sync across {} channels for workspace {}",
                channels != null ? channels.size() : "default", workspaceId);
        Map<String, Object> result = slackClientService.syncChannels(workspaceId, token, channels, limitPerChannel);
        return ResponseEntity.ok(result);
    }
}
