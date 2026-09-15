package com.vanguard.predictivebudget.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class LlmExpenseResponse {

    @JsonProperty("has_expense")
    private Boolean hasExpense;

    @JsonProperty("item")
    private String item;

    @JsonProperty("estimated_cost")
    private BigDecimal estimatedCost;

    @JsonProperty("confidence")
    private Integer confidence;

    @JsonProperty("is_benchmark")
    @Builder.Default
    private Boolean isBenchmark = false;
}
