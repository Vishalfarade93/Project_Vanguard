package com.vanguard.predictivebudget.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vanguard.predictivebudget.model.RawMessage;
import com.vanguard.predictivebudget.model.SpendRequest;
import com.vanguard.predictivebudget.model.Workspace;
import com.vanguard.predictivebudget.repository.RawMessageRepository;
import com.vanguard.predictivebudget.repository.WorkspaceRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.WebSocket;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@RequiredArgsConstructor
@Slf4j
public class SlackSocketModeService {

    @Value("${slack.socket.app-token:}")
    private String appToken;

    @Value("${slack.socket.enabled:true}")
    private boolean socketModeEnabled;

    private final SpendRequestService spendRequestService;
    private final RawMessageRepository rawMessageRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ExpenseExtractionService expenseExtractionService;
    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private WebSocket currentWebSocket;
    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    private ExecutorService connectionExecutor;

    @PostConstruct
    public void init() {
        if (!socketModeEnabled || appToken == null || appToken.isBlank() || !appToken.startsWith("xapp-")) {
            log.info("Slack Socket Mode is disabled or invalid App Token configured.");
            return;
        }

        log.info("Initializing Slack Socket Mode WebSocket Client with App Token (xapp-...)");
        isRunning.set(true);
        connectionExecutor = Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "slack-socket-mode-thread");
            t.setDaemon(true);
            return t;
        });

        connectionExecutor.submit(this::lifecycleLoop);
    }

    @PreDestroy
    public void cleanup() {
        isRunning.set(false);
        if (currentWebSocket != null) {
            try {
                currentWebSocket.sendClose(WebSocket.NORMAL_CLOSURE, "Application shutting down");
            } catch (Exception ignored) {}
        }
        if (connectionExecutor != null) {
            connectionExecutor.shutdownNow();
        }
    }

    private void lifecycleLoop() {
        while (isRunning.get()) {
            try {
                String wsUrl = fetchWebSocketUrl();
                if (wsUrl == null || wsUrl.isBlank()) {
                    log.warn("Failed to obtain Slack WebSocket URL. Retrying in 10 seconds...");
                    Thread.sleep(10000);
                    continue;
                }

                log.info("Connecting to Slack Socket Mode WebSocket: {}", maskUrl(wsUrl));
                CompletableFuture<WebSocket> wsFuture = httpClient.newWebSocketBuilder()
                        .connectTimeout(Duration.ofSeconds(15))
                        .buildAsync(URI.create(wsUrl), new SlackWebSocketListener());

                currentWebSocket = wsFuture.get();
                log.info("Successfully connected to Slack Socket Mode WebSocket! Ready to receive live /buy commands and channel events without ngrok.");

                // Wait until disconnected
                while (isRunning.get() && currentWebSocket != null && !currentWebSocket.isInputClosed() && !currentWebSocket.isOutputClosed()) {
                    Thread.sleep(2000);
                }
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("Slack Socket Mode connection error: {}. Reconnecting in 5 seconds...", e.getMessage());
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException ignored) {
                    break;
                }
            }
        }
    }

    private String fetchWebSocketUrl() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://slack.com/api/apps.connections.open"))
                    .header("Authorization", "Bearer " + appToken.trim())
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200 && response.body() != null) {
                JsonNode root = objectMapper.readTree(response.body());
                if (root.path("ok").asBoolean(false)) {
                    return root.path("url").asText();
                } else {
                    log.error("Slack apps.connections.open returned ok=false: {}", root.path("error").asText());
                }
            } else {
                log.error("Slack apps.connections.open failed HTTP status {}: {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Failed to call apps.connections.open: {}", e.getMessage());
        }
        return null;
    }

    private class SlackWebSocketListener implements WebSocket.Listener {
        private final StringBuilder messageBuffer = new StringBuilder();

        @Override
        public void onOpen(WebSocket webSocket) {
            log.info("Slack Socket Mode connection established.");
            WebSocket.Listener.super.onOpen(webSocket);
        }

        @Override
        public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
            messageBuffer.append(data);
            if (last) {
                String fullMessage = messageBuffer.toString();
                messageBuffer.setLength(0);
                handleIncomingMessage(webSocket, fullMessage);
            }
            return WebSocket.Listener.super.onText(webSocket, data, last);
        }

        @Override
        public CompletionStage<?> onClose(WebSocket webSocket, int statusCode, String reason) {
            log.warn("Slack Socket Mode closed: status={}, reason={}", statusCode, reason);
            return WebSocket.Listener.super.onClose(webSocket, statusCode, reason);
        }

        @Override
        public void onError(WebSocket webSocket, Throwable error) {
            log.error("Slack Socket Mode error: {}", error.getMessage());
            WebSocket.Listener.super.onError(webSocket, error);
        }
    }

    private void handleIncomingMessage(WebSocket webSocket, String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            String envelopeId = root.path("envelope_id").asText(null);
            String type = root.path("type").asText("");

            if ("disconnect".equalsIgnoreCase(type)) {
                log.warn("Slack sent disconnect message. Closing current connection to reconnect...");
                webSocket.sendClose(WebSocket.NORMAL_CLOSURE, "Slack requested disconnect");
                return;
            }

            // 1. Handle Slash Commands (e.g. /buy two dozens of cups for $110)
            if ("slash_commands".equalsIgnoreCase(type)) {
                JsonNode payload = root.path("payload");
                String command = payload.path("command").asText("/buy");
                String text = payload.path("text").asText("");
                String userName = payload.path("user_name").asText("team_member");
                String channelName = payload.path("channel_name").asText("general");
                String teamId = payload.path("team_id").asText("");

                log.info("Received Slash Command over Socket Mode: '{} {}' from @{} in #{}", command, text, userName, channelName);

                Long targetWorkspaceId = resolveWorkspaceId(teamId);
                String fullCommandText = command + " " + text;
                SpendRequest req = spendRequestService.processBuyCommand(
                        fullCommandText, "@" + userName, "#" + channelName, targetWorkspaceId);

                // Build rich acknowledgment response for Slack
                Map<String, Object> slackReply = new HashMap<>();
                slackReply.put("response_type", "in_channel");
                slackReply.put("text", String.format(
                        "💳 *Vanguard Spend Request Submitted*\n• *Item:* %s\n• *Amount:* $%.2f\n• *Department:* %s\n• *Status:* %s\n• *Policy Cap:* $%.2f (MCC Category: `%s`)\n_Manager approval requested. Virtual card will be issued automatically upon approval._",
                        req.getItemDescription(),
                        req.getRequestedAmount() != null ? req.getRequestedAmount() : req.getPolicyThreshold(),
                        req.getDepartment(),
                        req.getStatus(),
                        req.getPolicyThreshold(),
                        req.getMccCategoryLock()
                ));

                // Acknowledge envelope with payload
                Map<String, Object> ack = new HashMap<>();
                ack.put("envelope_id", envelopeId);
                ack.put("payload", slackReply);

                webSocket.sendText(objectMapper.writeValueAsString(ack), true);
                log.info("Acknowledged Slash Command envelope {} with in-channel confirmation.", envelopeId);
                return;
            }

            // 2. Handle Events API (Channel chat messages for Forecast AI Extraction)
            if ("events_api".equalsIgnoreCase(type)) {
                // Acknowledge envelope immediately to satisfy Slack's 3-second timeout
                if (envelopeId != null) {
                    Map<String, Object> ack = new HashMap<>();
                    ack.put("envelope_id", envelopeId);
                    webSocket.sendText(objectMapper.writeValueAsString(ack), true);
                }

                JsonNode payload = root.path("payload");
                JsonNode eventNode = payload.path("event");
                String eventType = eventNode.path("type").asText("");
                String teamId = payload.path("team_id").asText("");
                Long targetWorkspaceId = resolveWorkspaceId(teamId);

                if ("message".equalsIgnoreCase(eventType)) {
                    String subtype = eventNode.path("subtype").asText("");
                    if ("bot_message".equalsIgnoreCase(subtype)) {
                        return; // Ignore bot echoes
                    }

                    String content = eventNode.path("text").asText("");
                    String sender = eventNode.has("user") ? eventNode.path("user").asText()
                            : (eventNode.has("username") ? eventNode.path("username").asText() : "team_member");
                    String channel = eventNode.path("channel").asText("#general");
                    String timestamp = eventNode.path("ts").asText(String.valueOf(System.currentTimeMillis()));
                    String threadTs = eventNode.path("thread_ts").asText(null);

                    if (!content.trim().isEmpty()) {
                        String trimmed = content.trim();
                        if (trimmed.startsWith("/buy")) {
                            log.debug("Skipping message event for /buy as it was already handled by slash_commands.");
                            return;
                        } else if (trimmed.toLowerCase().startsWith("buy ") || trimmed.toLowerCase().startsWith("need to buy ")) {
                            log.info("Processing natural language buy message over Socket Mode from {}: '{}'", sender, trimmed);
                            spendRequestService.processBuyCommand(trimmed, sender, channel, targetWorkspaceId);
                        } else {
                            // Ingest for Forecast AI Extraction
                            RawMessage rawMessage = RawMessage.builder()
                                    .workspaceId(targetWorkspaceId)
                                    .content(content)
                                    .sender(sender)
                                    .timestamp(timestamp)
                                    .threadTs(threadTs)
                                    .sourceType("SLACK_SOCKET")
                                    .sourceChannelOrSubject(channel)
                                    .isProcessed(false)
                                    .build();

                            rawMessageRepository.save(rawMessage);
                            log.info("Saved raw message ID {} via Socket Mode from {}. Running AI expense extraction...", rawMessage.getId(), sender);

                            try {
                                expenseExtractionService.processUnprocessedMessages();
                            } catch (Exception ex) {
                                log.error("Extraction error: {}", ex.getMessage());
                            }
                        }
                    }
                }
                return;
            }

            // Default simple ACK for other envelope types
            if (envelopeId != null) {
                Map<String, Object> ack = new HashMap<>();
                ack.put("envelope_id", envelopeId);
                webSocket.sendText(objectMapper.writeValueAsString(ack), true);
            }
        } catch (Exception e) {
            log.error("Error handling Slack Socket Mode message: {}", e.getMessage(), e);
        }
    }

    private Long resolveWorkspaceId(String teamId) {
        if (teamId != null && !teamId.isBlank()) {
            return workspaceRepository.findBySlackTeamId(teamId.trim())
                    .map(Workspace::getId)
                    .orElse(1L);
        }
        return 1L;
    }

    private String maskUrl(String url) {
        if (url == null || url.length() < 30) return url;
        return url.substring(0, 30) + "...";
    }
}
