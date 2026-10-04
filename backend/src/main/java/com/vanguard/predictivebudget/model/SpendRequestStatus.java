package com.vanguard.predictivebudget.model;

public enum SpendRequestStatus {
    PENDING_APPROVAL,
    EXCEEDS_POLICY,
    APPROVED_CARD_ISSUED,
    REJECTED,
    CARD_SWIPED,
    RECONCILED
}
