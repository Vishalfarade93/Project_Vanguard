package com.vanguard.predictivebudget.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "raw_message")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RawMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workspace_id")
    private Long workspaceId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private String sender;

    private String timestamp;

    @Column(name = "source_type")
    @Builder.Default
    private String sourceType = "SLACK";

    @Column(name = "source_channel_or_subject")
    private String sourceChannelOrSubject;

    @Column(name = "thread_ts")
    private String threadTs;

    @Column(name = "topic_key")
    private String topicKey;

    @Column(name = "is_processed", nullable = false)
    @Builder.Default
    private boolean isProcessed = false;

    public void setProcessed(boolean isProcessed) {
        this.isProcessed = isProcessed;
    }

    public void setIsProcessed(boolean isProcessed) {
        this.isProcessed = isProcessed;
    }

    public boolean isProcessed() {
        return this.isProcessed;
    }

    public boolean getIsProcessed() {
        return this.isProcessed;
    }
}
