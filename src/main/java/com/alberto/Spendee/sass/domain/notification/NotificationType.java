package com.alberto.Spendee.sass.domain.notification;

public enum NotificationType {
    SPENDING_LIMIT_WARNING("Spending Limit Warning"),
    SPENDING_LIMIT_EXCEEDED("Spending Limit Exceeded"),
    BUDGET_ALERT("Budget Alert"),
    TRANSACTION_ALERT("Transaction Alert"),
    GENERAL("General");

    private final String displayName;

    NotificationType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
