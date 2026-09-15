package com.vanguard.predictivebudget.config;

import com.vanguard.predictivebudget.model.ExpenseStatus;
import com.vanguard.predictivebudget.model.PredictedExpense;
import com.vanguard.predictivebudget.model.RawMessage;
import com.vanguard.predictivebudget.model.Workspace;
import com.vanguard.predictivebudget.repository.PredictedExpenseRepository;
import com.vanguard.predictivebudget.repository.RawMessageRepository;
import com.vanguard.predictivebudget.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final WorkspaceRepository workspaceRepository;
    private final RawMessageRepository rawMessageRepository;
    private final PredictedExpenseRepository predictedExpenseRepository;
    private final com.vanguard.predictivebudget.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (workspaceRepository.count() > 0) {
            return;
        }

        log.info("Initializing demo workspace, sample team messages, and predicted expenses...");

        // 1. Create default workspace
        Workspace workspace = Workspace.builder()
                .name("Acme Corp Engineering & Design")
                .slug("acme-corp")
                .slackToken("xoxb-simulated-token-92837192")
                .slackTeamId("T_ACME_CORP")
                .slackBotName("vanguard_budget_bot")
                .monitoredChannels("#infrastructure-cloud, #procurement-tools, #sales-closers")
                .inboundEmailSlug("acme-corp")
                .build();
        workspace = workspaceRepository.save(workspace);

        // 1b. Seed default demo admin user for Acme Corp
        com.vanguard.predictivebudget.model.User demoAdmin = com.vanguard.predictivebudget.model.User.builder()
                .workspaceId(workspace.getId())
                .email("admin@acmecorp.com")
                .fullName("Sarah Jenkins (VP Finance)")
                .passwordHash(passwordEncoder.encode("password123"))
                .role("ORG_ADMIN")
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(demoAdmin);
        log.info("Seeded default demo admin user: admin@acmecorp.com (password: password123)");

        // 2. Create sample processed & unprocessed raw chat messages
        RawMessage msg1 = RawMessage.builder()
                .workspaceId(workspace.getId())
                .sender("Sarah (Lead Architect)")
                .content("We need to spin up 4 dedicated GPU cluster instances on AWS next month for training our custom embeddings. Budgeting roughly $3,800.")
                .timestamp(String.valueOf(System.currentTimeMillis() - 86400000))
                .isProcessed(true)
                .build();

        RawMessage msg2 = RawMessage.builder()
                .workspaceId(workspace.getId())
                .sender("Marcus (Design VP)")
                .content("Figma enterprise annual seat renewal is coming up in two months. Total bill will be around $4,200 for 15 designers.")
                .timestamp(String.valueOf(System.currentTimeMillis() - 43200000))
                .isProcessed(true)
                .build();

        RawMessage msg3 = RawMessage.builder()
                .workspaceId(workspace.getId())
                .sender("Elena (Head of Growth)")
                .content("Let's book 3 flights and hotel passes for the SaaStr Annual Conference in September. Estimated cost about $2,650.")
                .timestamp(String.valueOf(System.currentTimeMillis() - 21600000))
                .isProcessed(true)
                .build();

        RawMessage msg4 = RawMessage.builder()
                .workspaceId(workspace.getId())
                .sender("David (Engineering Manager)")
                .content("We are bringing in a senior security penetration tester on a freelance contract next week. Quote came in at $5,500.")
                .timestamp(String.valueOf(System.currentTimeMillis() - 10800000))
                .isProcessed(true)
                .build();

        RawMessage msg5 = RawMessage.builder()
                .workspaceId(workspace.getId())
                .sender("Chloe (People Ops)")
                .content("Offsite venue catering deposit for the Q4 all-hands gathering is due next month: $1,800.")
                .timestamp(String.valueOf(System.currentTimeMillis() - 5400000))
                .isProcessed(true)
                .build();

        // One pending raw message ready for user to click "Run AI Extraction" and see immediate processing!
        RawMessage msgPending = RawMessage.builder()
                .workspaceId(workspace.getId())
                .sender("Liam (Tech Lead)")
                .content("Just talked to MongoDB Atlas team; upgrading our database cluster tier next week will add approximately $850/mo.")
                .timestamp(String.valueOf(System.currentTimeMillis()))
                .isProcessed(false)
                .build();

        rawMessageRepository.saveAll(List.of(msg1, msg2, msg3, msg4, msg5, msgPending));

        // 3. Create initial PredictedExpense items
        LocalDate now = LocalDate.now();

        PredictedExpense exp1 = PredictedExpense.builder()
                .workspaceId(workspace.getId())
                .rawMessageId(msg1.getId())
                .itemDescription("AWS Dedicated GPU Cluster Instances")
                .estimatedAmount(new BigDecimal("3800.00"))
                .costRangeMin(new BigDecimal("3200.00"))
                .costRangeMax(new BigDecimal("4400.00"))
                .confidenceScore(94)
                .predictedDate(now.plusMonths(1).withDayOfMonth(5))
                .status(ExpenseStatus.PENDING)
                .sourceType("SLACK")
                .sourceChannelOrSubject("#infrastructure-scale")
                .rawSnippet(msg1.getContent())
                .aiReasoning("Model detected requirement for 4x g5.2xlarge GPU compute instances on AWS for fine-tuning embeddings. Estimated based on on-demand hourly rate over a 30-day billing cycle.")
                .department("INFRASTRUCTURE")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        PredictedExpense exp2 = PredictedExpense.builder()
                .workspaceId(workspace.getId())
                .rawMessageId(msg2.getId())
                .itemDescription("Figma Enterprise Annual Renewal (15 seats)")
                .estimatedAmount(new BigDecimal("4200.00"))
                .costRangeMin(new BigDecimal("4000.00"))
                .costRangeMax(new BigDecimal("4500.00"))
                .confidenceScore(98)
                .predictedDate(now.plusMonths(2).withDayOfMonth(15))
                .status(ExpenseStatus.APPROVED)
                .sourceType("GMAIL")
                .sourceChannelOrSubject("Email: Figma Enterprise Renewal Notice")
                .rawSnippet(msg2.getContent())
                .aiReasoning("Contract renewal detected from VP of Design. 15 enterprise seats at $280/seat-annual commitment.")
                .department("DESIGN")
                .createdAt(LocalDateTime.now().minusHours(12))
                .build();

        PredictedExpense exp3 = PredictedExpense.builder()
                .workspaceId(workspace.getId())
                .rawMessageId(msg3.getId())
                .itemDescription("SaaStr Annual Travel & Conference Passes")
                .estimatedAmount(new BigDecimal("2650.00"))
                .costRangeMin(new BigDecimal("2400.00"))
                .costRangeMax(new BigDecimal("3000.00"))
                .confidenceScore(89)
                .predictedDate(now.plusMonths(1).withDayOfMonth(20))
                .status(ExpenseStatus.PENDING)
                .sourceType("SLACK")
                .sourceChannelOrSubject("#growth-marketing")
                .rawSnippet(msg3.getContent())
                .aiReasoning("3 conference passes ($1,500) plus round-trip flights and hotel booking for SaaStr Annual in SF.")
                .department("GENERAL_OPS")
                .createdAt(LocalDateTime.now().minusHours(6))
                .build();

        PredictedExpense exp4 = PredictedExpense.builder()
                .workspaceId(workspace.getId())
                .rawMessageId(msg4.getId())
                .itemDescription("Senior Security Penetration Testing Contractor")
                .estimatedAmount(new BigDecimal("5500.00"))
                .costRangeMin(new BigDecimal("5000.00"))
                .costRangeMax(new BigDecimal("6000.00"))
                .confidenceScore(91)
                .predictedDate(now.plusWeeks(1))
                .status(ExpenseStatus.PENDING)
                .sourceType("SLACK")
                .sourceChannelOrSubject("#security-compliance")
                .rawSnippet(msg4.getContent())
                .aiReasoning("Engagement of external certified auditor for quarterly SOC2 external penetration test quote.")
                .department("CONTRACTORS")
                .createdAt(LocalDateTime.now().minusHours(3))
                .build();

        PredictedExpense exp5 = PredictedExpense.builder()
                .workspaceId(workspace.getId())
                .rawMessageId(msg5.getId())
                .itemDescription("Q4 All-Hands Catering & Venue Deposit")
                .estimatedAmount(new BigDecimal("1800.00"))
                .costRangeMin(new BigDecimal("1600.00"))
                .costRangeMax(new BigDecimal("2000.00"))
                .confidenceScore(85)
                .predictedDate(now.plusMonths(2).withDayOfMonth(28))
                .status(ExpenseStatus.APPROVED)
                .sourceType("SLACK")
                .sourceChannelOrSubject("#people-ops")
                .rawSnippet(msg5.getContent())
                .aiReasoning("Quarterly company event venue booking deposit fee for 50 attendees.")
                .department("GENERAL_OPS")
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();

        PredictedExpense exp6 = PredictedExpense.builder()
                .workspaceId(workspace.getId())
                .rawMessageId(null)
                .itemDescription("Cloud Data Storage Capacity Expansion (50 TB)")
                .estimatedAmount(new BigDecimal("1500.00"))
                .costRangeMin(new BigDecimal("1275.00"))
                .costRangeMax(new BigDecimal("1875.00"))
                .confidenceScore(95)
                .predictedDate(now.plusMonths(1).withDayOfMonth(1))
                .status(ExpenseStatus.PENDING)
                .sourceType("GMAIL")
                .sourceChannelOrSubject("Email: AWS S3 Data Lake 50TB Capacity Expansion")
                .rawSnippet("Hi Finance, our engineering team confirmed we need to expand data storage capacity by 50TB next month on AWS S3 to support our customer ingestion pipeline.")
                .aiReasoning("Identified 50 TB cloud data storage expansion. Modeled against AWS S3 Standard object storage tier ($23.00/TB) plus cross-region lifecycle replication ($7.00/TB).")
                .department("INFRASTRUCTURE")
                .createdAt(LocalDateTime.now())
                .build();

        predictedExpenseRepository.saveAll(List.of(exp1, exp2, exp3, exp4, exp5, exp6));
        log.info("Initialized {} sample predicted expenses successfully.", 5);
    }
}
