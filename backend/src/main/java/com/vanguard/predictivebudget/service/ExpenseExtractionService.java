package com.vanguard.predictivebudget.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vanguard.predictivebudget.dto.LlmExpenseResponse;
import com.vanguard.predictivebudget.model.ExpenseStatus;
import com.vanguard.predictivebudget.model.PredictedExpense;
import com.vanguard.predictivebudget.model.RawMessage;
import com.vanguard.predictivebudget.repository.PredictedExpenseRepository;
import com.vanguard.predictivebudget.repository.RawMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseExtractionService {

    private final RawMessageRepository rawMessageRepository;
    private final PredictedExpenseRepository predictedExpenseRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent}")
    private String geminiApiUrl;

    public static final String SYSTEM_PROMPT =
            "Analyze this message for future business expenses. If an expense is mentioned, return a strict JSON object with keys: has_expense (boolean), item (string), estimated_cost (number), confidence (1-100). If no expense is found, set has_expense to false.";

    private final CloudCapacityEstimator cloudCapacityEstimator;

    @jakarta.annotation.PostConstruct
    public void cleanupLegacyBuyForecasts() {
        try {
            List<PredictedExpense> all = predictedExpenseRepository.findAll();
            int deleted = 0;
            for (PredictedExpense exp : all) {
                if (exp.getRawSnippet() != null) {
                    String s = exp.getRawSnippet().trim().toLowerCase();
                    if (s.startsWith("/buy") || s.startsWith("buy ") || s.startsWith("need to buy ")) {
                        predictedExpenseRepository.delete(exp);
                        deleted++;
                    }
                }
            }
            if (deleted > 0) {
                log.info("Cleaned up {} legacy /buy requests from forecast ledger.", deleted);
            }
        } catch (Exception e) {
            log.debug("Cleanup warning: {}", e.getMessage());
        }
    }

    /**
     * Scheduled service that runs every 5 minutes (300,000 milliseconds)
     */
    @Scheduled(fixedRate = 300000)
    public void scheduledExtraction() {
        log.info("Running scheduled expense extraction job...");
        int processedCount = processUnprocessedMessages();
        log.info("Scheduled expense extraction finished. Processed {} messages.", processedCount);
    }

    /**
     * Can be invoked manually or by the scheduled job.
     */
    @Transactional
    public int processUnprocessedMessages() {
        List<RawMessage> unprocessedMessages = rawMessageRepository.findByIsProcessedFalse();
        if (unprocessedMessages.isEmpty()) {
            log.debug("No unprocessed messages found.");
            return 0;
        }

        log.info("Found {} unprocessed messages for expense extraction.", unprocessedMessages.size());
        int extractedCount = 0;

        for (RawMessage message : unprocessedMessages) {
            try {
                String rawContent = message.getContent() != null ? message.getContent().trim() : "";
                // Strictly exclude spend requests (/buy) from AI Runway Forecast Ledger
                if (rawContent.startsWith("/buy") || rawContent.toLowerCase().startsWith("buy ") || rawContent.toLowerCase().startsWith("need to buy ")) {
                    message.setIsProcessed(true);
                    rawMessageRepository.save(message);
                    log.info("Skipped /buy spend command from forecast ledger: '{}'", rawContent);
                    continue;
                }

                Long targetWsId = message.getWorkspaceId() != null ? message.getWorkspaceId() : 1L;
                String threadTs = message.getThreadTs();
                String topicKey = message.getTopicKey() != null ? message.getTopicKey() : deduceTopicKey(message.getContent());
                LocalDate targetDate = estimateDateFromContent(message.getContent());
                int advanceDaysNotice = Math.max(1, (int) ChronoUnit.DAYS.between(LocalDate.now(), targetDate));

                CloudCapacityEstimator.CapacityEstimationResult capacityResult =
                        cloudCapacityEstimator.estimateCapacity(message.getContent());

                if (capacityResult.isMatched()) {
                    // Specialized cloud capacity & storage domain extraction
                    PredictedExpense existing = findExistingPrediction(targetWsId, threadTs, topicKey, message.getSourceType());

                    if (existing != null) {
                        int rev = (existing.getRevisionCount() != null ? existing.getRevisionCount() : 1) + 1;
                        existing.setRevisionCount(rev);
                        existing.setEstimatedAmount(capacityResult.getEstimatedCost());
                        existing.setCostRangeMin(capacityResult.getCostMin());
                        existing.setCostRangeMax(capacityResult.getCostMax());
                        existing.setConfidenceScore(capacityResult.getConfidenceScore());
                        existing.setRawSnippet(message.getContent());
                        existing.setAiReasoning("Capacity update across " + rev + " iterations: " + capacityResult.getAiReasoning());
                        if (message.getSourceType() != null) {
                            existing.setSourceType(message.getSourceType());
                        }
                        if (message.getSourceChannelOrSubject() != null) {
                            existing.setSourceChannelOrSubject(message.getSourceChannelOrSubject());
                        }
                        existing.setStatus(ExpenseStatus.PENDING);
                        String prior = existing.getConversationContext() != null ? existing.getConversationContext() : "";
                        existing.setConversationContext(prior + "\n[Capacity Revision #" + rev + "]: " + message.getContent());
                        predictedExpenseRepository.save(existing);
                        extractedCount++;
                        log.info("Updated existing capacity expense ID {}: '{}' - ${}", existing.getId(), existing.getItemDescription(), existing.getEstimatedAmount());
                    } else {
                        PredictedExpense expense = PredictedExpense.builder()
                                .workspaceId(targetWsId)
                                .rawMessageId(message.getId())
                                .itemDescription(capacityResult.getItemDescription())
                                .estimatedAmount(capacityResult.getEstimatedCost())
                                .costRangeMin(capacityResult.getCostMin())
                                .costRangeMax(capacityResult.getCostMax())
                                .confidenceScore(capacityResult.getConfidenceScore())
                                .predictedDate(targetDate)
                                .status(ExpenseStatus.PENDING)
                                .sourceType(message.getSourceType() != null ? message.getSourceType() : "SLACK")
                                .sourceChannelOrSubject(message.getSourceChannelOrSubject() != null ? message.getSourceChannelOrSubject() : "#infrastructure")
                                .rawSnippet(message.getContent())
                                .aiReasoning(capacityResult.getAiReasoning())
                                .department("INFRASTRUCTURE")
                                .threadTs(threadTs)
                                .topicKey(topicKey)
                                .isBenchmarkEstimate(false)
                                .revisionCount(1)
                                .advanceDaysNotice(advanceDaysNotice)
                                .conversationContext("Initial capacity notice (" + (message.getSender() != null ? message.getSender() : "team") + "): \"" + message.getContent() + "\"")
                                .createdAt(LocalDateTime.now())
                                .build();

                        predictedExpenseRepository.save(expense);
                        extractedCount++;
                        log.info("Specialized Capacity Extractor added expense: '{}' - ${}", expense.getItemDescription(), expense.getEstimatedAmount());
                    }
                } else {
                    // Standard LLM / Heuristic pipeline
                    LlmExpenseResponse response = analyzeMessageWithLlm(message.getContent());

                    if (response != null && Boolean.TRUE.equals(response.getHasExpense())) {
                        BigDecimal cost = response.getEstimatedCost() != null ? response.getEstimatedCost() : BigDecimal.ZERO;
                        String department = deduceDepartment(message.getContent(), response.getItem());

                        PredictedExpense existing = findExistingPrediction(targetWsId, threadTs, topicKey, message.getSourceType());

                        if (existing != null) {
                            if (message.getSourceType() != null) {
                                existing.setSourceType(message.getSourceType());
                            }
                            if (message.getSourceChannelOrSubject() != null) {
                                existing.setSourceChannelOrSubject(message.getSourceChannelOrSubject());
                            }
                            existing.setStatus(ExpenseStatus.PENDING);
                            // Conversational Thread Reconciliation: update existing instead of creating duplicate
                            int currentRevisions = existing.getRevisionCount() != null ? existing.getRevisionCount() : 1;
                            int newRevisions = currentRevisions + 1;
                            existing.setRevisionCount(newRevisions);

                            String lowerContent = message.getContent().toLowerCase();
                            boolean isConcluded = lowerContent.contains("agreed") || lowerContent.contains("final")
                                    || lowerContent.contains("done") || lowerContent.contains("approved")
                                    || lowerContent.contains("settled") || lowerContent.contains("deal")
                                    || lowerContent.contains("sounds good") || lowerContent.contains("let's go with")
                                    || lowerContent.contains("confirmed") || lowerContent.contains("perfect");

                            int newConfidence = isConcluded ? 96 : Math.min(95, Math.max(existing.getConfidenceScore(), response.getConfidence() != null ? response.getConfidence() : 80));
                            existing.setConfidenceScore(newConfidence);

                            if (cost.compareTo(BigDecimal.ZERO) > 0) {
                                BigDecimal oldCost = existing.getEstimatedAmount();
                                existing.setEstimatedAmount(cost);
                                existing.setCostRangeMin(cost.multiply(BigDecimal.valueOf(0.9)).setScale(2, RoundingMode.HALF_UP));
                                existing.setCostRangeMax(cost.multiply(BigDecimal.valueOf(1.2)).setScale(2, RoundingMode.HALF_UP));

                                if (Boolean.FALSE.equals(response.getIsBenchmark())) {
                                    existing.setIsBenchmarkEstimate(false);
                                }

                                String priorContext = existing.getConversationContext() != null ? existing.getConversationContext() : ("Initial: " + existing.getRawSnippet());
                                existing.setConversationContext(priorContext + "\n[Revision #" + newRevisions + " (" + (message.getSender() != null ? message.getSender() : "team") + ")]: \"" + message.getContent() + "\" -> Price revised from $" + oldCost + " to $" + cost + (isConcluded ? " (Concluded Final)" : ""));
                                existing.setAiReasoning("Concluded negotiated price across " + newRevisions + " conversational exchanges. Latest finalized agreement established at $" + cost + (isConcluded ? " with mutual confirmation." : "."));
                            } else {
                                String priorContext = existing.getConversationContext() != null ? existing.getConversationContext() : ("Initial: " + existing.getRawSnippet());
                                existing.setConversationContext(priorContext + "\n[Discussion (" + (message.getSender() != null ? message.getSender() : "team") + ")]: \"" + message.getContent() + "\"");
                            }

                            existing.setRawSnippet(message.getContent());
                            if (threadTs != null && existing.getThreadTs() == null) {
                                existing.setThreadTs(threadTs);
                            }
                            if (topicKey != null && existing.getTopicKey() == null) {
                                existing.setTopicKey(topicKey);
                            }

                            predictedExpenseRepository.save(existing);
                            extractedCount++;
                            log.info("Reconciled conversational thread for workspace {} (threadTs: {}, topicKey: {}): Finalized price is ${} (Revision #{})",
                                    targetWsId, threadTs, topicKey, existing.getEstimatedAmount(), newRevisions);
                        } else {
                            // Check for identical duplicate repost
                            String normalizedContent = message.getContent().replaceAll("[\\s_\"'*]", "").toLowerCase();
                            boolean isDuplicate = predictedExpenseRepository.findByWorkspaceId(targetWsId).stream()
                                    .anyMatch(e -> e.getEstimatedAmount() != null && cost != null &&
                                            e.getEstimatedAmount().compareTo(cost) == 0 &&
                                            e.getRawSnippet() != null &&
                                            e.getRawSnippet().replaceAll("[\\s_\"'*]", "").toLowerCase().equals(normalizedContent));

                            if (!isDuplicate) {
                                BigDecimal minCost = cost.multiply(BigDecimal.valueOf(0.85)).setScale(2, RoundingMode.HALF_UP);
                                BigDecimal maxCost = cost.multiply(BigDecimal.valueOf(1.25)).setScale(2, RoundingMode.HALF_UP);

                                String reasoning = Boolean.TRUE.equals(response.getIsBenchmark())
                                        ? "AI Benchmark Price Model applied: No explicit price stated in message. Automated market pricing benchmark calculated at $" + cost + " based on standard industry rates."
                                        : generateAiReasoning(message.getContent(), response.getItem(), cost);

                                PredictedExpense expense = PredictedExpense.builder()
                                        .workspaceId(targetWsId)
                                        .rawMessageId(message.getId())
                                        .itemDescription(response.getItem() != null ? response.getItem() : "Upcoming Business Expense")
                                        .estimatedAmount(cost)
                                        .costRangeMin(minCost)
                                        .costRangeMax(maxCost)
                                        .confidenceScore(response.getConfidence() != null ? response.getConfidence() : 75)
                                        .predictedDate(targetDate)
                                        .status(ExpenseStatus.PENDING)
                                        .sourceType(message.getSourceType() != null ? message.getSourceType() : "SLACK")
                                        .sourceChannelOrSubject(message.getSourceChannelOrSubject() != null ? message.getSourceChannelOrSubject() : "#general")
                                        .rawSnippet(message.getContent())
                                        .aiReasoning(reasoning)
                                        .department(department)
                                        .threadTs(threadTs)
                                        .topicKey(topicKey)
                                        .isBenchmarkEstimate(Boolean.TRUE.equals(response.getIsBenchmark()))
                                        .revisionCount(1)
                                        .advanceDaysNotice(advanceDaysNotice)
                                        .conversationContext("Initial detection (" + (message.getSender() != null ? message.getSender() : "team") + "): \"" + message.getContent() + "\"")
                                        .createdAt(LocalDateTime.now())
                                        .build();

                                predictedExpenseRepository.save(expense);
                                extractedCount++;
                                log.info("Extracted new predicted expense: '{}' - ${} (Benchmark: {}, Confidence: {}%)",
                                        expense.getItemDescription(), expense.getEstimatedAmount(), expense.getIsBenchmarkEstimate(), expense.getConfidenceScore());
                            } else {
                                log.debug("Skipping duplicate predicted expense: '{}' - ${}", response.getItem(), cost);
                            }
                        }
                    }
                }

                // Mark message as processed
                message.setProcessed(true);
                rawMessageRepository.save(message);

            } catch (Exception e) {
                log.error("Error processing message ID {}: {}", message.getId(), e.getMessage(), e);
                message.setProcessed(true);
                rawMessageRepository.save(message);
            }
        }

        return extractedCount;
    }

    private PredictedExpense findExistingPrediction(Long workspaceId, String threadTs, String topicKey, String sourceType) {
        if (threadTs != null && !threadTs.trim().isEmpty()) {
            var byThread = predictedExpenseRepository.findFirstByWorkspaceIdAndThreadTsOrderByCreatedAtDesc(workspaceId, threadTs.trim());
            if (byThread.isPresent() && byThread.get().getStatus() != ExpenseStatus.RETRACTED) {
                return byThread.get();
            }
        }
        if (topicKey != null && !topicKey.trim().isEmpty()) {
            var byTopic = predictedExpenseRepository.findFirstByWorkspaceIdAndTopicKeyOrderByCreatedAtDesc(workspaceId, topicKey.trim());
            if (byTopic.isPresent() && byTopic.get().getStatus() != ExpenseStatus.RETRACTED) {
                String existingSource = byTopic.get().getSourceType();
                if (sourceType == null || existingSource == null || sourceType.equalsIgnoreCase(existingSource)) {
                    return byTopic.get();
                }
            }
        }
        return null;
    }

    public String deduceTopicKey(String content) {
        if (content == null) return null;
        String lower = content.toLowerCase();

        // City-to-city travel or flight route
        if (lower.contains("pune") && lower.contains("mumbai")) {
            return "travel:pune-mumbai";
        }
        if (lower.contains("flight") || lower.contains("fly") || lower.contains("airfare")) {
            return "travel:flight";
        }
        if (lower.contains("hotel") || lower.contains("lodging")) {
            return "travel:hotel";
        }

        // Contractors / Specific Roles
        if (lower.contains("ui developer") || lower.contains("ui dev") || lower.contains("frontend") || lower.contains("ui designer")) {
            return "contractor:ui-dev";
        }
        if (lower.contains("backend") || lower.contains("full stack") || lower.contains("fullstack")) {
            return "contractor:backend-dev";
        }
        if (lower.contains("devops") || lower.contains("sre") || lower.contains("cloud engineer")) {
            return "contractor:devops";
        }
        if (lower.contains("hire") || lower.contains("contractor") || lower.contains("freelancer")) {
            return "contractor:general";
        }

        // Software tools
        if (lower.contains("figma")) {
            return "software:figma";
        }
        if (lower.contains("github")) {
            return "software:github";
        }
        if (lower.contains("slack")) {
            return "software:slack";
        }
        if (lower.contains("datadog")) {
            return "software:datadog";
        }

        // Infrastructure
        if (lower.contains("snowflake")) {
            return "infra:snowflake";
        }
        if (lower.contains("mongodb") || lower.contains("mongo")) {
            return "infra:mongodb";
        }
        if (lower.contains("aws") || lower.contains("cloud") || lower.contains("storage") || lower.contains("server")) {
            return "infra:cloud";
        }

        return null;
    }

    public static class BenchmarkEstimate {
        public final boolean matched;
        public final BigDecimal amount;
        public final String item;
        public final String department;
        public final int confidence;
        public final String reasoning;

        public BenchmarkEstimate(boolean matched, BigDecimal amount, String item, String department, int confidence, String reasoning) {
            this.matched = matched;
            this.amount = amount;
            this.item = item;
            this.department = department;
            this.confidence = confidence;
            this.reasoning = reasoning;
        }

        public static BenchmarkEstimate none() {
            return new BenchmarkEstimate(false, BigDecimal.ZERO, null, null, 0, null);
        }
    }

    public BenchmarkEstimate deduceBenchmarkEstimate(String text) {
        if (text == null) return BenchmarkEstimate.none();
        String lower = text.toLowerCase();

        // 1. Travel & Flights without quoted price
        if (lower.contains("flight") || lower.contains("fly") || lower.contains("airline") || lower.contains("airfare")
                || (lower.contains("ticket") && (lower.contains("pune") || lower.contains("mumbai") || lower.contains("travel")))) {
            if (lower.contains("pune") && lower.contains("mumbai")) {
                return new BenchmarkEstimate(
                        true,
                        new BigDecimal("140.00"),
                        "Flight Booking: Pune to Mumbai Route",
                        "TRAVEL",
                        85,
                        "Automated Market Benchmark: Regional travel between Pune and Mumbai modeled at $140.00 based on standard regional airline/transit indexes."
                );
            }
            if (lower.contains("international") || lower.contains("london") || lower.contains("us") || lower.contains("europe") || lower.contains("san francisco")) {
                return new BenchmarkEstimate(
                        true,
                        new BigDecimal("1250.00"),
                        "International Flight Booking",
                        "TRAVEL",
                        80,
                        "Automated Market Benchmark: International flight travel modeled at $1,250.00."
                );
            }
            return new BenchmarkEstimate(
                    true,
                    new BigDecimal("250.00"),
                    "Domestic Commercial Airfare",
                    "TRAVEL",
                    82,
                    "Automated Market Benchmark: Domestic flight travel modeled at standard $250.00 corporate benchmark."
            );
        }

        if (lower.contains("hotel") || lower.contains("accommodation") || lower.contains("lodging")) {
            return new BenchmarkEstimate(
                    true,
                    new BigDecimal("350.00"),
                    "Corporate Lodging & Hotel Stay",
                    "TRAVEL",
                    80,
                    "Automated Market Benchmark: Corporate hotel stay estimated at standard $350.00 benchmark."
            );
        }

        // 2. Hiring & Contractors without quoted price
        if (lower.contains("ui developer") || lower.contains("ui dev") || lower.contains("frontend") || lower.contains("ui designer")) {
            return new BenchmarkEstimate(
                    true,
                    new BigDecimal("3500.00"),
                    "Contractor Hiring: UI/Frontend Developer",
                    "CONTRACTORS",
                    86,
                    "Automated Market Benchmark: UI Developer rate benchmarked at $3,500.00/month based on current tech contractor indexes."
            );
        }
        if (lower.contains("backend") || lower.contains("full stack") || lower.contains("fullstack")) {
            return new BenchmarkEstimate(
                    true,
                    new BigDecimal("4200.00"),
                    "Contractor Hiring: Backend / Full-Stack Engineer",
                    "CONTRACTORS",
                    85,
                    "Automated Market Benchmark: Backend Engineer rate benchmarked at $4,200.00/month."
            );
        }
        if (lower.contains("devops") || lower.contains("sre") || lower.contains("cloud engineer")) {
            return new BenchmarkEstimate(
                    true,
                    new BigDecimal("4800.00"),
                    "Contractor Hiring: DevOps / Cloud Engineer",
                    "CONTRACTORS",
                    85,
                    "Automated Market Benchmark: DevOps Engineer rate benchmarked at $4,800.00/month."
            );
        }
        if (lower.contains("hire") || lower.contains("freelancer") || lower.contains("contractor") || lower.contains("consultant")) {
            return new BenchmarkEstimate(
                    true,
                    new BigDecimal("3000.00"),
                    "External Professional Contractor Engagement",
                    "CONTRACTORS",
                    80,
                    "Automated Market Benchmark: Professional contractor engagement benchmarked at $3,000.00."
            );
        }

        // 3. Infrastructure & Scaling without quoted price
        if (lower.contains("aws") || lower.contains("cloud") || lower.contains("server") || lower.contains("compute")) {
            return new BenchmarkEstimate(
                    true,
                    new BigDecimal("800.00"),
                    "Cloud Compute & Server Scaling Capacity",
                    "INFRASTRUCTURE",
                    85,
                    "Automated Market Benchmark: Cloud server scaling provision estimated at $800.00."
            );
        }

        // 4. Software & Tools without quoted price
        if (lower.contains("figma")) {
            return new BenchmarkEstimate(
                    true,
                    new BigDecimal("150.00"),
                    "Figma Professional Team Subscriptions",
                    "SOFTWARE_TOOLS",
                    90,
                    "Automated Market Benchmark: Figma team licensing tier modeled at $150.00."
            );
        }
        if (lower.contains("software") || lower.contains("license") || lower.contains("saas") || lower.contains("subscription")) {
            return new BenchmarkEstimate(
                    true,
                    new BigDecimal("300.00"),
                    "Enterprise Software Subscription & Licensing",
                    "SOFTWARE_TOOLS",
                    80,
                    "Automated Market Benchmark: Standard enterprise SaaS seat expansion modeled at $300.00."
            );
        }

        return BenchmarkEstimate.none();
    }

    private String deduceDepartment(String content, String item) {
        String combined = ((content != null ? content : "") + " " + (item != null ? item : "")).toLowerCase();
        if (combined.contains("flight") || combined.contains("fly") || combined.contains("hotel") || combined.contains("travel")
                || combined.contains("conference") || combined.contains("trip") || combined.contains("airline")
                || combined.contains("cab") || combined.contains("pune") || combined.contains("mumbai")) {
            return "TRAVEL";
        }
        if (combined.contains("hire") || combined.contains("developer") || combined.contains("contractor")
                || combined.contains("freelance") || combined.contains("consultant") || combined.contains("designer")
                || combined.contains("engineer") || combined.contains("agency")) {
            return "CONTRACTORS";
        }
        if (combined.contains("cloud") || combined.contains("aws") || combined.contains("server")
                || combined.contains("storage") || combined.contains("database") || combined.contains("infra")
                || combined.contains("gpu") || combined.contains("snowflake") || combined.contains("mongodb")) {
            return "INFRASTRUCTURE";
        }
        if (combined.contains("figma") || combined.contains("slack") || combined.contains("github")
                || combined.contains("license") || combined.contains("saas") || combined.contains("subscription")
                || combined.contains("software") || combined.contains("datadog") || combined.contains("tool")) {
            return "SOFTWARE_TOOLS";
        }
        return "GENERAL_OPS";
    }

    private String generateAiReasoning(String content, String item, BigDecimal cost) {
        return String.format(
                "Extracted intent from communication regarding '%s'. Detected operational timeline. Estimated cost modeled at $%s with +/- 15%% contingency margin.",
                item != null ? item : "Business Need", cost);
    }

    /**
     * Calls Gemini API or falls back to intelligent heuristic parser if API key is not configured.
     */
    public LlmExpenseResponse analyzeMessageWithLlm(String content) {
        if (content == null || content.trim().isEmpty()) {
            return LlmExpenseResponse.builder().hasExpense(false).build();
        }

        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            try {
                return callGeminiApi(content);
            } catch (Exception ex) {
                log.warn("Gemini API call failed, falling back to heuristic extraction: {}", ex.getMessage());
            }
        }

        // Reliable fallback engine
        return heuristicExpenseExtractor(content);
    }

    private LlmExpenseResponse callGeminiApi(String messageText) throws Exception {
        String url = geminiApiUrl + "?key=" + geminiApiKey.trim();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String prompt = SYSTEM_PROMPT + "\n\nMessage: \"" + messageText + "\"";

        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> contentMap = Map.of("parts", List.of(textPart));
        Map<String, Object> generationConfig = Map.of("responseMimeType", "application/json");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(contentMap));
        requestBody.put("generationConfig", generationConfig);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    String jsonText = parts.get(0).path("text").asText();
                    return cleanAndParseJson(jsonText);
                }
            }
        }

        return heuristicExpenseExtractor(messageText);
    }

    private LlmExpenseResponse cleanAndParseJson(String jsonText) {
        try {
            String sanitized = jsonText.trim();
            if (sanitized.startsWith("```json")) {
                sanitized = sanitized.substring(7);
            } else if (sanitized.startsWith("```")) {
                sanitized = sanitized.substring(3);
            }
            if (sanitized.endsWith("```")) {
                sanitized = sanitized.substring(0, sanitized.length() - 3);
            }
            sanitized = sanitized.trim();
            return objectMapper.readValue(sanitized, LlmExpenseResponse.class);
        } catch (Exception e) {
            log.warn("Failed to parse LLM JSON output: {}. Raw: {}", e.getMessage(), jsonText);
            return heuristicExpenseExtractor(jsonText);
        }
    }

    /**
     * Smart heuristic extraction engine that identifies common business expense patterns,
     * amounts, items, and confidence ratings when offline or without an API key.
     */
    public LlmExpenseResponse heuristicExpenseExtractor(String text) {
        if (text == null) {
            return LlmExpenseResponse.builder().hasExpense(false).build();
        }

        // Strip URLs to avoid extracting port numbers or query params as expense amounts
        String sanitizedText = text.replaceAll("https?://\\S+", "");
        String lower = sanitizedText.toLowerCase();

        // Check if there are expense-related keywords or financial indicators
        boolean hasKeywords = lower.contains("flight") || lower.contains("fly") || lower.contains("hotel")
                || lower.contains("conference") || lower.contains("ticket") || lower.contains("subscription")
                || lower.contains("license") || lower.contains("software") || lower.contains("aws")
                || lower.contains("cloud") || lower.contains("server") || lower.contains("freelancer")
                || lower.contains("contractor") || lower.contains("consultant") || lower.contains("purchase")
                || lower.contains("buying") || lower.contains("renew") || lower.contains("equipment")
                || lower.contains("laptop") || lower.contains("monitor") || lower.contains("cost")
                || lower.contains("spend") || lower.contains("budget") || lower.contains("invoice")
                || lower.contains("catering") || lower.contains("dinner") || lower.contains("offsite")
                || lower.contains("hire") || lower.contains("rate") || lower.contains("quote")
                || lower.contains("pay") || lower.contains("need $") || lower.contains("for $");

        // Look for explicit currency amounts e.g., $1,200, $2,400, $3,500, $5k, $3.5k, 3500 USD, 500 dollars
        Pattern explicitDollarPattern = Pattern.compile("\\$\\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]+)?|[0-9]+(?:\\.[0-9]+)?)\\s*(k|thousand)?", Pattern.CASE_INSENSITIVE);
        Pattern amountPattern = Pattern.compile("([0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]{2})?|[0-9]+(?:\\.[0-9]+)?)\\s*(k|thousand)?\\s*(?:USD|dollars?)", Pattern.CASE_INSENSITIVE);

        Matcher explicitMatcher = explicitDollarPattern.matcher(sanitizedText);
        BigDecimal amount = null;

        if (explicitMatcher.find()) {
            String numStr = explicitMatcher.group(1).replace(",", "");
            boolean isK = explicitMatcher.group(2) != null;
            try {
                BigDecimal base = new BigDecimal(numStr);
                amount = isK ? base.multiply(BigDecimal.valueOf(1000)) : base;
            } catch (Exception ignored) {}
        } else {
            Matcher generalMatcher = amountPattern.matcher(sanitizedText);
            if (generalMatcher.find()) {
                String match = generalMatcher.group(1).replace(",", "");
                boolean isK = generalMatcher.group(2) != null;
                try {
                    BigDecimal base = new BigDecimal(match);
                    amount = isK ? base.multiply(BigDecimal.valueOf(1000)) : base;
                } catch (Exception ignored) {}
            }
        }

        // If no explicit dollar amount is stated, evaluate market benchmarks!
        if (amount == null) {
            BenchmarkEstimate benchmark = deduceBenchmarkEstimate(sanitizedText);
            if (benchmark.matched) {
                return LlmExpenseResponse.builder()
                        .hasExpense(true)
                        .item(benchmark.item)
                        .estimatedCost(benchmark.amount)
                        .confidence(benchmark.confidence)
                        .isBenchmark(true)
                        .build();
            }

            // If neither explicit amount nor market benchmark matched, this is not an actionable expense
            return LlmExpenseResponse.builder().hasExpense(false).build();
        }

        // Explicit amount was found, deduce item description
        String item = "Upcoming Business Expense";
        int confidence = 75;

        if (lower.contains("flight") || lower.contains("fly") || lower.contains("conference") || lower.contains("summit") || lower.contains("ticket")) {
            item = (lower.contains("pune") && lower.contains("mumbai")) ? "Flight / Transit: Pune to Mumbai Route" : "Conference Travel & Flight Bookings";
            confidence = 90;
        } else if (lower.contains("subscription") || lower.contains("license") || lower.contains("figma") || lower.contains("slack") || lower.contains("github")) {
            item = lower.contains("figma") ? "Figma Team Subscriptions" : "Software License & SaaS Subscription";
            confidence = 92;
        } else if (lower.contains("freelancer") || lower.contains("contractor") || lower.contains("consultant") || lower.contains("agency") || lower.contains("hire") || lower.contains("developer")) {
            item = lower.contains("ui") ? "Contractor Hiring: UI Developer" : "External Contractor / Freelance Services";
            confidence = 88;
        } else if (lower.contains("aws") || lower.contains("cloud") || lower.contains("server") || lower.contains("hosting")) {
            item = "Cloud Infrastructure & Server Scaling";
            confidence = 90;
        } else if (lower.contains("laptop") || lower.contains("macbook") || lower.contains("equipment") || lower.contains("monitor")) {
            item = "Hardware & Office Equipment Purchase";
            confidence = 85;
        } else if (lower.contains("catering") || lower.contains("dinner") || lower.contains("offsite") || lower.contains("team event")) {
            item = "Team Offsite & Catering Event";
            confidence = 80;
        }

        return LlmExpenseResponse.builder()
                .hasExpense(true)
                .item(item)
                .estimatedCost(amount)
                .confidence(Math.max(10, Math.min(100, confidence)))
                .isBenchmark(false)
                .build();
    }

    private LocalDate estimateDateFromContent(String content) {
        String lower = content.toLowerCase();
        LocalDate now = LocalDate.now();

        if (lower.contains("next week")) {
            return now.plusWeeks(1);
        } else if (lower.contains("next month")) {
            return now.plusMonths(1);
        } else if (lower.contains("in two months") || lower.contains("in 2 months")) {
            return now.plusMonths(2);
        } else if (lower.contains("in 3 weeks") || lower.contains("in three weeks")) {
            return now.plusWeeks(3);
        } else if (lower.contains("q3")) {
            return LocalDate.of(now.getYear(), 9, 15);
        } else if (lower.contains("q4")) {
            return LocalDate.of(now.getYear(), 11, 15);
        } else if (lower.contains("tomorrow")) {
            return now.plusDays(1);
        }
        // Default to upcoming 21 days
        return now.plusDays(21);
    }
}
