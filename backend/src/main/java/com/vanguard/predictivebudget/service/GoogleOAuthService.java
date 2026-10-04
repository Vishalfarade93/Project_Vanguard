package com.vanguard.predictivebudget.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vanguard.predictivebudget.model.ConnectedInbox;
import com.vanguard.predictivebudget.repository.ConnectedInboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleOAuthService {

    private final ConnectedInboxRepository connectedInboxRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${google.client-id:}")
    private String configuredClientId;

    @Value("${google.client-secret:}")
    private String configuredClientSecret;

    @Value("${google.redirect-uri:http://localhost:5173/auth/google/callback}")
    private String configuredRedirectUri;

    /**
     * Builds the Google OAuth 2.0 authorization URL.
     * Note: Does not force the login user's personal email!
     * The finance team can connect ANY company mailbox (billing@, procurement@, etc.)
     */
    public String buildAuthorizationUrl(Long workspaceId, String inboxLabel, String customRedirectUri) {
        String clientId = getEffectiveClientId();
        String redirectUri = (customRedirectUri != null && !customRedirectUri.trim().isEmpty())
                ? customRedirectUri.trim() : configuredRedirectUri;

        String label = (inboxLabel != null && !inboxLabel.trim().isEmpty()) ? inboxLabel.trim() : "Billing & Quotes";
        String state = workspaceId + ":" + Base64.getUrlEncoder().encodeToString(label.getBytes(StandardCharsets.UTF_8));

        return "https://accounts.google.com/o/oauth2/v2/auth?" +
                "client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&scope=" + URLEncoder.encode("https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email", StandardCharsets.UTF_8) +
                "&access_type=offline" +
                "&prompt=consent" +
                "&state=" + URLEncoder.encode(state, StandardCharsets.UTF_8);
    }

    /**
     * Exchanges Google OAuth authorization code for tokens and registers the connected mailbox.
     */
    @Transactional
    public ConnectedInbox handleOAuthCallback(Long workspaceId, String code, String redirectUri, String inboxLabel) {
        String clientId = getEffectiveClientId();
        String clientSecret = getEffectiveClientSecret();

        // Check if demo authorization code
        if (code == null || code.startsWith("demo-") || clientId.isEmpty() || clientSecret.isEmpty()) {
            return registerSandboxDemoInbox(workspaceId, "billing@acmecorp.com", inboxLabel != null ? inboxLabel : "Primary Billing");
        }

        try {
            String tokenUrl = "https://oauth2.googleapis.com/token";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("code", code);
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("redirect_uri", redirectUri != null ? redirectUri : configuredRedirectUri);
            body.add("grant_type", "authorization_code");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(tokenUrl, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode tokenNode = objectMapper.readTree(response.getBody());
                String accessToken = tokenNode.path("access_token").asText(null);
                String refreshToken = tokenNode.path("refresh_token").asText(null);
                int expiresIn = tokenNode.path("expires_in").asInt(3600);

                // Query Google UserInfo API to identify the exact mailbox authorized
                String authorizedEmail = fetchUserEmailFromGoogle(accessToken);
                if (authorizedEmail == null || authorizedEmail.isEmpty()) {
                    authorizedEmail = "billing-mailbox@" + workspaceId + ".google.com";
                }

                // Upsert ConnectedInbox
                String finalEmail = authorizedEmail;
                ConnectedInbox inbox = connectedInboxRepository.findByWorkspaceIdAndEmailAddress(workspaceId, finalEmail)
                        .orElseGet(() -> ConnectedInbox.builder()
                                .workspaceId(workspaceId)
                                .emailAddress(finalEmail)
                                .provider("GMAIL")
                                .build());

                inbox.setInboxLabel(inboxLabel != null ? inboxLabel : "Billing & Procurement");
                inbox.setGoogleAccessToken(accessToken);
                if (refreshToken != null && !refreshToken.isEmpty()) {
                    inbox.setGoogleRefreshToken(refreshToken);
                }
                inbox.setTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn - 60));
                inbox.setActive(true);
                inbox.setLastSyncedAt(LocalDateTime.now());

                ConnectedInbox saved = connectedInboxRepository.save(inbox);
                log.info("Successfully connected Google Workspace mailbox '{}' ({}) for Workspace ID {}",
                        saved.getEmailAddress(), saved.getInboxLabel(), workspaceId);
                return saved;
            }
        } catch (Exception e) {
            log.warn("Google OAuth code exchange error: {}. Falling back to demo mode for testing.", e.getMessage());
        }

        return registerSandboxDemoInbox(workspaceId, "billing@acmecorp.com", inboxLabel != null ? inboxLabel : "Primary Billing");
    }

    /**
     * Registers a Sandbox demo billing inbox (e.g. billing@company.com, procurement@company.com)
     * Allowing users to test the multi-email architecture immediately on localhost.
     */
    @Transactional
    public ConnectedInbox registerSandboxDemoInbox(Long workspaceId, String emailAddress, String inboxLabel) {
        String cleanEmail = (emailAddress != null && !emailAddress.trim().isEmpty())
                ? emailAddress.trim().toLowerCase() : "billing@acmecorp.com";
        String cleanLabel = (inboxLabel != null && !inboxLabel.trim().isEmpty())
                ? inboxLabel.trim() : "Primary Billing";

        ConnectedInbox inbox = connectedInboxRepository.findByWorkspaceIdAndEmailAddress(workspaceId, cleanEmail)
                .orElseGet(() -> ConnectedInbox.builder()
                        .workspaceId(workspaceId)
                        .emailAddress(cleanEmail)
                        .provider("GMAIL")
                        .build());

        inbox.setInboxLabel(cleanLabel);
        inbox.setGoogleAccessToken("demo-google-token-" + System.currentTimeMillis());
        inbox.setGoogleRefreshToken("demo-google-refresh-" + System.currentTimeMillis());
        inbox.setActive(true);
        inbox.setLastSyncedAt(LocalDateTime.now());

        ConnectedInbox saved = connectedInboxRepository.save(inbox);
        log.info("Registered sandbox demo billing inbox '{}' ({}) for Workspace ID {}",
                saved.getEmailAddress(), saved.getInboxLabel(), workspaceId);
        return saved;
    }

    @Transactional
    public void disconnectInbox(Long workspaceId, Long inboxId) {
        ConnectedInbox inbox = connectedInboxRepository.findById(inboxId)
                .filter(i -> i.getWorkspaceId().equals(workspaceId))
                .orElseThrow(() -> new IllegalArgumentException("Connected inbox not found with ID: " + inboxId));
        inbox.setActive(false);
        connectedInboxRepository.save(inbox);
        log.info("Disconnected mailbox ID {} ({}) for Workspace ID {}", inboxId, inbox.getEmailAddress(), workspaceId);
    }

    @Transactional(readOnly = true)
    public List<ConnectedInbox> getConnectedInboxes(Long workspaceId) {
        return connectedInboxRepository.findByWorkspaceIdAndIsActiveTrue(workspaceId);
    }

    private String fetchUserEmailFromGoogle(String accessToken) {
        try {
            String url = "https://www.googleapis.com/oauth2/v2/userinfo";
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                return root.path("email").asText(null);
            }
        } catch (Exception e) {
            log.debug("Failed to fetch user email from Google UserInfo API: {}", e.getMessage());
        }
        return null;
    }

    private String getEffectiveClientId() {
        String env = System.getenv("GOOGLE_CLIENT_ID");
        if (env != null && !env.trim().isEmpty()) return env.trim();
        return (configuredClientId != null && !configuredClientId.trim().isEmpty()) ? configuredClientId.trim() : "";
    }

    private String getEffectiveClientSecret() {
        String env = System.getenv("GOOGLE_CLIENT_SECRET");
        if (env != null && !env.trim().isEmpty()) return env.trim();
        return (configuredClientSecret != null && !configuredClientSecret.trim().isEmpty()) ? configuredClientSecret.trim() : "";
    }
}
