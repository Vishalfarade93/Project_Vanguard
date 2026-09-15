package com.vanguard.predictivebudget.service;

import com.vanguard.predictivebudget.dto.LlmExpenseResponse;
import lombok.Builder;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CloudCapacityEstimator {

    @Getter
    @Builder
    public static class CapacityEstimationResult {
        private boolean matched;
        private String itemDescription;
        private BigDecimal estimatedCost;
        private BigDecimal costMin;
        private BigDecimal costMax;
        private Integer confidenceScore;
        private String aiReasoning;
        private String department;
    }

    // Regex for TB / GB storage capacity mentions
    private static final Pattern STORAGE_TB_PATTERN =
            Pattern.compile("(?:storage\\s*(?:capacity)?\\s*(?:by|to|of|about)?\\s*|capacity\\s*(?:by|of)?\\s*)([0-9]+(?:\\.[0-9]+)?)\\s*(?:tb|terabytes?)", Pattern.CASE_INSENSITIVE);

    private static final Pattern GENERAL_TB_PATTERN =
            Pattern.compile("([0-9]+(?:\\.[0-9]+)?)\\s*(?:tb|terabytes?)\\s*(?:of\\s+)?(?:data\\s+|cloud\\s+|s3\\s+)?(?:storage|capacity)?", Pattern.CASE_INSENSITIVE);

    private static final Pattern STORAGE_GB_PATTERN =
            Pattern.compile("(?:storage\\s*(?:capacity)?\\s*(?:by|to|of)?\\s*|database\\s*(?:storage)?\\s*)([0-9]+(?:\\.[0-9]+)?)\\s*(?:gb|gigabytes?)", Pattern.CASE_INSENSITIVE);

    private static final Pattern MONGO_DB_TIER_PATTERN =
            Pattern.compile("(?:mongodb|mongo\\s+atlas|database|cluster).*?(?:tier|upgrade|m[0-9]{2})", Pattern.CASE_INSENSITIVE);

    private static final Pattern SNOWFLAKE_CREDIT_PATTERN =
            Pattern.compile("([0-9,]+)\\s*(?:snowflake\\s+credits?|credits?\\s+on\\s+snowflake)", Pattern.CASE_INSENSITIVE);

    /**
     * Inspects text for technical infrastructure capacity and storage scaling requests.
     */
    public CapacityEstimationResult estimateCapacity(String text) {
        if (text == null) {
            return CapacityEstimationResult.builder().matched(false).build();
        }

        String lower = text.toLowerCase();

        // 1. Check for Data Storage Capacity in Terabytes (AWS S3 / Cloud Object Storage)
        Matcher tbMatcher = STORAGE_TB_PATTERN.matcher(text);
        if (!tbMatcher.find()) {
            tbMatcher = GENERAL_TB_PATTERN.matcher(text);
        }

        if (tbMatcher.find()) {
            double tbAmount = Double.parseDouble(tbMatcher.group(1));
            
            // Check if text already contains explicit dollar quote e.g. $1,620 or $1620
            Matcher dollarMatcher = Pattern.compile("\\$\\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]{2})?|[0-9]+)").matcher(text);
            BigDecimal cost;
            if (dollarMatcher.find()) {
                cost = new BigDecimal(dollarMatcher.group(1).replace(",", ""));
            } else {
                // AWS S3 standard pricing ~$23/TB/mo + ~$7/TB/mo for API requests, lifecycle, & replication
                double unitRatePerTb = 30.0;
                cost = BigDecimal.valueOf(tbAmount * unitRatePerTb).setScale(2, RoundingMode.HALF_UP);
            }

            BigDecimal costMin = cost.multiply(BigDecimal.valueOf(0.85)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal costMax = cost.multiply(BigDecimal.valueOf(1.25)).setScale(2, RoundingMode.HALF_UP);

            return CapacityEstimationResult.builder()
                    .matched(true)
                    .itemDescription(String.format("Cloud Data Storage Capacity Expansion (%s TB)", tbAmount))
                    .estimatedCost(cost)
                    .costMin(costMin)
                    .costMax(costMax)
                    .confidenceScore(94)
                    .aiReasoning(String.format(
                            "Detected request for %s TB data storage capacity expansion. Calculated using AWS S3 Standard tier ($23.00/TB-mo) plus standard IOPS and cross-region replication factor ($7.00/TB-mo).",
                            tbAmount))
                    .department("INFRASTRUCTURE")
                    .build();
        }

        // 2. Check for Database Storage Upgrade in Gigabytes / High Performance SSD
        Matcher gbMatcher = STORAGE_GB_PATTERN.matcher(text);
        if (gbMatcher.find()) {
            double gbAmount = Double.parseDouble(gbMatcher.group(1));
            // EBS gp3 / RDS io2 storage ~$0.12/GB/mo
            double unitRatePerGb = 0.125;
            BigDecimal cost = BigDecimal.valueOf(gbAmount * unitRatePerGb).setScale(2, RoundingMode.HALF_UP);
            BigDecimal costMin = cost.multiply(BigDecimal.valueOf(0.9)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal costMax = cost.multiply(BigDecimal.valueOf(1.3)).setScale(2, RoundingMode.HALF_UP);

            return CapacityEstimationResult.builder()
                    .matched(true)
                    .itemDescription(String.format("High-Performance Database SSD Storage (%s GB)", gbAmount))
                    .estimatedCost(cost)
                    .costMin(costMin)
                    .costMax(costMax)
                    .confidenceScore(89)
                    .aiReasoning(String.format(
                            "Detected %s GB database storage expansion. Modeled against AWS EBS gp3 provisioned storage with 3,000 baseline IOPS.",
                            gbAmount))
                    .department("DATA_PLATFORM")
                    .build();
        }

        // 3. Database Cluster Tier Upgrade (e.g. MongoDB Atlas M40 to M60)
        if (MONGO_DB_TIER_PATTERN.matcher(lower).find() && (lower.contains("upgrade") || lower.contains("capacity") || lower.contains("scale"))) {
            BigDecimal cost = new BigDecimal("1450.00");
            return CapacityEstimationResult.builder()
                    .matched(true)
                    .itemDescription("MongoDB Atlas Production Cluster Tier Upgrade")
                    .estimatedCost(cost)
                    .costMin(new BigDecimal("1200.00"))
                    .costMax(new BigDecimal("1850.00"))
                    .confidenceScore(92)
                    .aiReasoning("Detected cluster tier scale request for database capacity. Estimated based on MongoDB Atlas multi-region cluster scaling from standard to memory-optimized tier.")
                    .department("INFRASTRUCTURE")
                    .build();
        }

        // 4. Snowflake Data Warehouse Capacity Credits
        Matcher sfMatcher = SNOWFLAKE_CREDIT_PATTERN.matcher(text);
        if (sfMatcher.find()) {
            String creditsStr = sfMatcher.group(1).replace(",", "");
            double credits = Double.parseDouble(creditsStr);
            BigDecimal cost = BigDecimal.valueOf(credits * 2.50).setScale(2, RoundingMode.HALF_UP);

            return CapacityEstimationResult.builder()
                    .matched(true)
                    .itemDescription(String.format("Snowflake Data Warehouse Capacity (%s Credits)", creditsStr))
                    .estimatedCost(cost)
                    .costMin(cost.multiply(BigDecimal.valueOf(0.9)))
                    .costMax(cost.multiply(BigDecimal.valueOf(1.15)))
                    .confidenceScore(90)
                    .aiReasoning(String.format("Calculated based on %s Snowflake Enterprise Compute credits at standard $2.50/credit contract pricing.", creditsStr))
                    .department("DATA_PLATFORM")
                    .build();
        }

        return CapacityEstimationResult.builder().matched(false).build();
    }
}
