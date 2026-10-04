package com.vanguard.predictivebudget.controller;

import com.vanguard.predictivebudget.model.ConnectedInbox;
import com.vanguard.predictivebudget.model.Workspace;
import com.vanguard.predictivebudget.repository.WorkspaceRepository;
import com.vanguard.predictivebudget.security.UserPrincipal;
import com.vanguard.predictivebudget.service.GmailSyncService;
import com.vanguard.predictivebudget.service.GoogleOAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/integrations/google")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class GoogleIntegrationController {

    private final GoogleOAuthService googleOAuthService;
    private final GmailSyncService gmailSyncService;
    private final WorkspaceRepository workspaceRepository;

    /**
     * Generates Google OAuth 2.0 authorization URL.
     * Note: Allows connecting ANY company billing mailbox (billing@, finance@, etc.),
     * independent of the user's login account!
     */
    @GetMapping("/auth-url")
    public ResponseEntity<?> getAuthUrl(
            @RequestParam(required = false, defaultValue = "Billing & Quotes") String inboxLabel,
            @RequestParam(required = false) String redirectUri,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;
        String url = googleOAuthService.buildAuthorizationUrl(workspaceId, inboxLabel, redirectUri);
        return ResponseEntity.ok(Map.of(
                "authUrl", url,
                "workspaceId", workspaceId,
                "inboxLabel", inboxLabel
        ));
    }

    /**
     * OAuth code callback handler.
     */
    @PostMapping("/callback")
    public ResponseEntity<?> handleCallback(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;
        String code = payload.get("code");
        String redirectUri = payload.get("redirectUri");
        String inboxLabel = payload.getOrDefault("inboxLabel", "Billing & Quotes");

        ConnectedInbox inbox = googleOAuthService.handleOAuthCallback(workspaceId, code, redirectUri, inboxLabel);
        return ResponseEntity.ok(inbox);
    }

    /**
     * 1-Click Sandbox / Evaluation connector:
     * Allows instantly connecting any designated company billing mailbox
     * (e.g. billing@company.com, procurement@company.com, etc.)
     * without blocking on Google Cloud Console OAuth app review.
     */
    @PostMapping("/sandbox-connect")
    public ResponseEntity<?> sandboxConnect(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;
        String email = payload.getOrDefault("emailAddress", "billing@acmecorp.com");
        String label = payload.getOrDefault("inboxLabel", "Primary Billing");

        ConnectedInbox inbox = googleOAuthService.registerSandboxDemoInbox(workspaceId, email, label);
        return ResponseEntity.ok(inbox);
    }

    /**
     * Returns all active connected inboxes for this workspace.
     */
    @GetMapping("/inboxes")
    public ResponseEntity<List<ConnectedInbox>> getConnectedInboxes(
            @AuthenticationPrincipal UserPrincipal principal) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;
        List<ConnectedInbox> inboxes = googleOAuthService.getConnectedInboxes(workspaceId);
        return ResponseEntity.ok(inboxes);
    }

    /**
     * Triggers procurement scan for a specific inbox or all workspace inboxes.
     */
    @PostMapping("/sync")
    public ResponseEntity<?> syncMailboxes(
            @RequestParam(required = false) Long inboxId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;

        if (inboxId != null) {
            Map<String, Object> result = gmailSyncService.syncInbox(inboxId);
            return ResponseEntity.ok(result);
        } else {
            Map<String, Object> result = gmailSyncService.syncAllWorkspaceInboxes(workspaceId);
            return ResponseEntity.ok(result);
        }
    }

    /**
     * Disconnects a specific mailbox.
     */
    @DeleteMapping("/inbox/{inboxId}")
    public ResponseEntity<?> disconnectInbox(
            @PathVariable Long inboxId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;
        googleOAuthService.disconnectInbox(workspaceId, inboxId);
        return ResponseEntity.ok(Map.of("status", "disconnected", "inboxId", inboxId));
    }

    /**
     * Returns the latest Gmail forwarding verification code received for this workspace.
     */
    @GetMapping("/verification-code")
    public ResponseEntity<?> getForwardingVerificationCode(
            @AuthenticationPrincipal UserPrincipal principal) {
        Long workspaceId = principal != null ? principal.getWorkspaceId() : 1L;
        Workspace ws = workspaceRepository.findById(workspaceId).orElse(null);
        String code = ws != null ? ws.getGmailForwardingCode() : null;

        return ResponseEntity.ok(Map.of(
                "workspaceId", workspaceId,
                "verificationCode", code != null ? code : "",
                "hasCode", code != null && !code.trim().isEmpty()
        ));
    }
}
