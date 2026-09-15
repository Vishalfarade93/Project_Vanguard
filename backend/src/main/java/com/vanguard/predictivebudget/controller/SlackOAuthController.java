package com.vanguard.predictivebudget.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vanguard.predictivebudget.model.Workspace;
import com.vanguard.predictivebudget.repository.WorkspaceRepository;
import com.vanguard.predictivebudget.security.UserPrincipal;
import com.vanguard.predictivebudget.service.SlackClientService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/slack/oauth")
@RequiredArgsConstructor
@Slf4j
public class SlackOAuthController {

    private final WorkspaceRepository workspaceRepository;
    private final SlackClientService slackClientService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${slack.oauth.client-id:}")
    private String clientId;

    @Value("${slack.oauth.client-secret:}")
    private String clientSecret;

    @Value("${slack.oauth.redirect-uri:http://localhost:8080/api/slack/oauth/callback}")
    private String redirectUri;

    @Value("${slack.oauth.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Generates the Slack OAuth 2.0 authorization URL.
     */
    @GetMapping("/authorize-url")
    public ResponseEntity<Map<String, Object>> getAuthorizeUrl(
            @RequestParam(required = false) Long workspaceId,
            @AuthenticationPrincipal UserPrincipal principal) {

        Long targetWorkspaceId = workspaceId;
        if (targetWorkspaceId == null && principal != null) {
            targetWorkspaceId = principal.getWorkspaceId();
        }
        if (targetWorkspaceId == null) {
            targetWorkspaceId = 1L;
        }

        boolean isConfigured = clientId != null && !clientId.trim().isEmpty()
                && clientSecret != null && !clientSecret.trim().isEmpty();

        if (!isConfigured) {
            return ResponseEntity.ok(Map.of(
                    "ok", false,
                    "isConfigured", false,
                    "message", "Slack OAuth is not configured. Please set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET, or use direct token connection."
            ));
        }

        // Required Bot OAuth scopes for reading message intent, auto-joining public channels, and sending alerts
        String scopes = "channels:history,channels:read,groups:history,groups:read,chat:write,team:read,channels:join";

        String authorizeUrl = String.format(
                "https://slack.com/oauth/v2/authorize?client_id=%s&scope=%s&redirect_uri=%s&state=%s",
                URLEncoder.encode(clientId.trim(), StandardCharsets.UTF_8),
                URLEncoder.encode(scopes, StandardCharsets.UTF_8),
                URLEncoder.encode(redirectUri.trim(), StandardCharsets.UTF_8),
                URLEncoder.encode(String.valueOf(targetWorkspaceId), StandardCharsets.UTF_8)
        );

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "isConfigured", true,
                "authorizeUrl", authorizeUrl
        ));
    }

    /**
     * Handles the OAuth 2.0 redirect callback from Slack.
     * Exchanges temporary authorization code for permanent Bot Token via oauth.v2.access.
     */
    @GetMapping("/callback")
    public void handleOAuthCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            HttpServletResponse response) throws IOException {

        log.info("Received Slack OAuth callback. code: {}, state: {}, error: {}", code != null ? "[PRESENT]" : "null", state, error);

        if (error != null && !error.trim().isEmpty()) {
            log.warn("Slack OAuth denied or error: {}", error);
            response.sendRedirect(frontendUrl + "?slack_error=" + URLEncoder.encode(error, StandardCharsets.UTF_8));
            return;
        }

        if (code == null || code.trim().isEmpty()) {
            log.error("Missing authorization code in Slack OAuth callback");
            response.sendRedirect(frontendUrl + "?slack_error=missing_code");
            return;
        }

        Long workspaceId = 1L;
        if (state != null && !state.trim().isEmpty()) {
            try {
                workspaceId = Long.parseLong(state.trim());
            } catch (NumberFormatException e) {
                log.warn("Invalid state parameter in Slack OAuth callback: {}", state);
            }
        }

        try {
            // Exchange code for bot access token via Slack API
            String tokenUrl = "https://slack.com/api/oauth.v2.access";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("client_id", clientId.trim());
            body.add("client_secret", clientSecret.trim());
            body.add("code", code.trim());
            body.add("redirect_uri", redirectUri.trim());

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> tokenResponse = restTemplate.postForEntity(tokenUrl, request, String.class);

            if (tokenResponse.getStatusCode().is2xxSuccessful() && tokenResponse.getBody() != null) {
                JsonNode root = objectMapper.readTree(tokenResponse.getBody());

                if (root.path("ok").asBoolean(false)) {
                    String botAccessToken = root.path("access_token").asText();
                    String teamName = root.path("team").path("name").asText("Slack Team");
                    String teamId = root.path("team").path("id").asText("");
                    String botUserId = root.path("bot_user_id").asText("vanguard_budget_bot");

                    log.info("Successfully exchanged Slack OAuth code for Workspace ID {}: Team '{}' ({})",
                            workspaceId, teamName, teamId);

                    // Update Workspace with retrieved credentials
                    final Long targetId = workspaceId;
                    workspaceRepository.findById(targetId).ifPresent(ws -> {
                        ws.setSlackToken(botAccessToken);
                        ws.setSlackTeamId(teamId);
                        ws.setSlackBotName(botUserId);

                        // Auto-discover channels and auto-join them
                        List<Map<String, String>> channels = slackClientService.listSlackChannels(botAccessToken);
                        for (Map<String, String> ch : channels) {
                            String chId = ch.get("id");
                            if (chId != null && !chId.startsWith("C_")) {
                                slackClientService.joinSlackChannel(botAccessToken, chId);
                            }
                        }

                        if ((ws.getMonitoredChannels() == null || ws.getMonitoredChannels().trim().isEmpty()) && !channels.isEmpty()) {
                            List<String> toMonitor = channels.stream()
                                    .limit(3)
                                    .map(ch -> ch.getOrDefault("name", "#general"))
                                    .toList();
                            ws.setMonitoredChannels(String.join(", ", toMonitor));
                        }

                        workspaceRepository.save(ws);
                        log.info("Saved Slack OAuth credentials and auto-joined channels for Workspace ID {}", ws.getId());

                        // Trigger initial sync of channels in background
                        try {
                            slackClientService.syncChannels(ws.getId(), botAccessToken, null, 25);
                        } catch (Exception ex) {
                            log.warn("Initial sync error following OAuth: {}", ex.getMessage());
                        }
                    });

                    response.sendRedirect(frontendUrl + "?slack_connected=true&team=" + URLEncoder.encode(teamName, StandardCharsets.UTF_8));
                    return;
                } else {
                    String slackError = root.path("error").asText("oauth_failed");
                    log.error("Slack oauth.v2.access returned error: {}", slackError);
                    response.sendRedirect(frontendUrl + "?slack_error=" + URLEncoder.encode(slackError, StandardCharsets.UTF_8));
                    return;
                }
            }
        } catch (Exception e) {
            log.error("Exception during Slack OAuth token exchange: {}", e.getMessage(), e);
            response.sendRedirect(frontendUrl + "?slack_error=" + URLEncoder.encode(e.getMessage() != null ? e.getMessage() : "internal_error", StandardCharsets.UTF_8));
            return;
        }

        response.sendRedirect(frontendUrl + "?slack_error=unknown_error");
    }
}
