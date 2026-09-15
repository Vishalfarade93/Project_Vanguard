package com.vanguard.predictivebudget;

import com.vanguard.predictivebudget.model.RawMessage;
import com.vanguard.predictivebudget.repository.PredictedExpenseRepository;
import com.vanguard.predictivebudget.repository.RawMessageRepository;
import com.vanguard.predictivebudget.security.JwtService;
import com.vanguard.predictivebudget.service.ExpenseExtractionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PredictiveBudgetApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RawMessageRepository rawMessageRepository;

    @Autowired
    private PredictedExpenseRepository predictedExpenseRepository;

    @Autowired
    private ExpenseExtractionService extractionService;

    @Autowired
    private JwtService jwtService;

    @Test
    void contextLoads() {
        assertThat(rawMessageRepository).isNotNull();
        assertThat(predictedExpenseRepository).isNotNull();
        assertThat(jwtService).isNotNull();
    }

    @Test
    void testGetExpensesApiRequiresAuth() throws Exception {
        // Unauthenticated request should be rejected with 403
        mockMvc.perform(get("/api/expenses"))
                .andExpect(status().isForbidden());

        // Authenticated request with valid JWT should succeed
        String token = jwtService.generateToken(1L, "admin@acmecorp.com", "ORG_ADMIN", 1L, "Acme Corp", "Admin User");
        mockMvc.perform(get("/api/expenses")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testAuthRegisterAndLogin() throws Exception {
        String registerPayload = "{\n" +
                "  \"companyName\": \"FinTech Cloud Ltd\",\n" +
                "  \"adminFullName\": \"Alice Wonderland\",\n" +
                "  \"email\": \"alice@fintechcloud.io\",\n" +
                "  \"password\": \"aliceSecure123\"\n" +
                "}";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("alice@fintechcloud.io"))
                .andExpect(jsonPath("$.workspace.name").value("FinTech Cloud Ltd"));

        String loginPayload = "{\n" +
                "  \"email\": \"alice@fintechcloud.io\",\n" +
                "  \"password\": \"aliceSecure123\"\n" +
                "}";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.fullName").value("Alice Wonderland"));
    }

    @Test
    void testSlackUrlVerificationChallenge() throws Exception {
        String challengePayload = "{\"type\": \"url_verification\", \"challenge\": \"testChallenge123\"}";

        mockMvc.perform(post("/api/slack/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(challengePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.challenge").value("testChallenge123"));
    }

    @Test
    void testSlackMessageIngestion() throws Exception {
        String eventPayload = "{\n" +
                "  \"type\": \"event_callback\",\n" +
                "  \"event\": {\n" +
                "    \"type\": \"message\",\n" +
                "    \"user\": \"U999\",\n" +
                "    \"text\": \"Need to buy 2 new monitors for the design desk, roughly $650 next week\",\n" +
                "    \"ts\": \"1710000099.000100\"\n" +
                "  }\n" +
                "}";

        long initialRawCount = rawMessageRepository.count();

        mockMvc.perform(post("/api/slack/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventPayload))
                .andExpect(status().isOk());

        assertThat(rawMessageRepository.count()).isGreaterThan(initialRawCount);
    }

    @Test
    void testExtractionServiceProcessesRawMessage() {
        RawMessage raw = RawMessage.builder()
                .workspaceId(1L)
                .sender("Finance Tester")
                .content("We need to renew our Datadog annual plan next month for $3,200")
                .isProcessed(false)
                .build();
        rawMessageRepository.save(raw);

        int count = extractionService.processUnprocessedMessages();
        assertThat(count).isGreaterThanOrEqualTo(1);

        RawMessage updated = rawMessageRepository.findById(raw.getId()).orElseThrow();
        assertThat(updated.isProcessed()).isTrue();
    }

    @Test
    void testSlackMultiTenantWebhookRouting() throws Exception {
        String eventPayload = "{\n" +
                "  \"type\": \"event_callback\",\n" +
                "  \"event\": {\n" +
                "    \"type\": \"message\",\n" +
                "    \"user\": \"U_TENANT_USER\",\n" +
                "    \"text\": \"Need to buy 5 licenses of Figma for $450 next month\",\n" +
                "    \"ts\": \"1710009999.000100\"\n" +
                "  }\n" +
                "}";

        mockMvc.perform(post("/api/slack/events?workspaceId=88")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventPayload))
                .andExpect(status().isOk());

        List<RawMessage> messages = rawMessageRepository.findByWorkspaceId(88L);
        assertThat(messages).isNotEmpty();
        assertThat(messages.get(0).getContent()).contains("Figma");
        assertThat(messages.get(0).getWorkspaceId()).isEqualTo(88L);
    }

    @Test
    void testTenantIntegrationStatusAndSaveChannels() throws Exception {
        String token = jwtService.generateToken(1L, "admin@acmecorp.com", "ORG_ADMIN", 1L, "Acme Corp", "Admin User");

        mockMvc.perform(get("/api/integrations/slack/status")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workspaceId").value(1))
                .andExpect(jsonPath("$.webhookUrl").value("/api/slack/events?workspaceId=1"));

        String channelsPayload = "{\"channels\": [\"#engineering\", \"#procurement\", \"#cloud-costs\"]}";
        mockMvc.perform(post("/api/integrations/slack/save-channels")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(channelsPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));
    }

    @Test
    void testInboundEmailWebhookRouting() throws Exception {
        String emailPayload = "{\n" +
                "  \"from\": \"billing@snowflake.com\",\n" +
                "  \"subject\": \"Snowflake Warehouse Capacity True-Up\",\n" +
                "  \"body\": \"Your monthly warehouse consumption will increase by $2,400 starting next billing cycle.\"\n" +
                "}";

        mockMvc.perform(post("/api/integrations/email/inbound/acme-corp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(emailPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.workspaceId").value(1));
    }
}

