package com.vanguard.predictivebudget.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "connected_inbox")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConnectedInbox {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workspace_id", nullable = false)
    private Long workspaceId;

    @Column(name = "email_address", nullable = false)
    private String emailAddress; // e.g. billing@company.com, finance@company.com

    @Column(name = "inbox_label")
    @Builder.Default
    private String inboxLabel = "Billing & Quotes"; // e.g. "Primary Billing", "Procurement", "Cloud Accounts"

    @Column(name = "provider")
    @Builder.Default
    private String provider = "GMAIL"; // GMAIL, OUTLOOK, etc.

    @Column(name = "google_refresh_token", length = 1000)
    private String googleRefreshToken;

    @Column(name = "google_access_token", length = 1000)
    private String googleAccessToken;

    @Column(name = "token_expires_at")
    private LocalDateTime tokenExpiresAt;

    @Column(name = "is_active")
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @Column(name = "messages_scanned_count")
    @Builder.Default
    private Integer messagesScannedCount = 0;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
