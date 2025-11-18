package com.alberto.Spendee.sass.domain.spendinglimit;

public enum LimitPeriod {
    DAILY("Daily"),
    WEEKLY("Weekly"),
    MONTHLY("Monthly"),
    YEARLY("Yearly");

    private final String displayName;

    LimitPeriod(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
