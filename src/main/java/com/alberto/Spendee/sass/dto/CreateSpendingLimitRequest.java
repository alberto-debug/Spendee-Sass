package com.alberto.Spendee.sass.dto;

import com.alberto.Spendee.sass.domain.spendinglimit.LimitPeriod;

import java.math.BigDecimal;

public class CreateSpendingLimitRequest {
    private Long categoryId; // null for global limit
    private BigDecimal limitAmount;
    private LimitPeriod period = LimitPeriod.MONTHLY;
    private BigDecimal notificationThreshold = new BigDecimal("0.80"); // 80%

    public CreateSpendingLimitRequest() {}

    public CreateSpendingLimitRequest(Long categoryId, BigDecimal limitAmount, LimitPeriod period) {
        this.categoryId = categoryId;
        this.limitAmount = limitAmount;
        this.period = period;
    }

    // Getters and setters
    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public BigDecimal getLimitAmount() {
        return limitAmount;
    }

    public void setLimitAmount(BigDecimal limitAmount) {
        this.limitAmount = limitAmount;
    }

    public LimitPeriod getPeriod() {
        return period;
    }

    public void setPeriod(LimitPeriod period) {
        this.period = period;
    }

    public BigDecimal getNotificationThreshold() {
        return notificationThreshold;
    }

    public void setNotificationThreshold(BigDecimal notificationThreshold) {
        this.notificationThreshold = notificationThreshold;
    }
}
