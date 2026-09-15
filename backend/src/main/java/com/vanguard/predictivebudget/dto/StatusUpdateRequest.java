package com.vanguard.predictivebudget.dto;

import com.vanguard.predictivebudget.model.ExpenseStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class StatusUpdateRequest {
    private ExpenseStatus status;
}
