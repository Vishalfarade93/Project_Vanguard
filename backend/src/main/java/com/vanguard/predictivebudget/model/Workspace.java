package com.vanguard.predictivebudget.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "workspace")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Workspace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String slug;

    @Column(name = "slack_token")
    private String slackToken;

    @Column(name = "slack_team_id")
    private String slackTeamId;

    @Column(name = "slack_bot_name")
    private String slackBotName;

    @Column(name = "monitored_channels", length = 1000)
    private String monitoredChannels;

    @Column(name = "inbound_email_slug")
    private String inboundEmailSlug;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
