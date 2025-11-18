package com.alberto.Spendee.sass.dto;

import com.alberto.Spendee.sass.domain.spendinglimit.LimitPeriod;

import java.math.BigDecimal;

public class SpendingLimitDto {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private BigDecimal limitAmount;
    private BigDecimal currentSpent;
    private LimitPeriod period;
    private BigDecimal notificationThreshold;
    private Boolean isActive;
    private BigDecimal remainingAmount;
    private BigDecimal usagePercentage;
    private Boolean isThresholdExceeded;
    private Boolean isLimitExceeded;

    public SpendingLimitDto() {}

    public SpendingLimitDto(Long id, Long categoryId, String categoryName, BigDecimal limitAmount, 
                           BigDecimal currentSpent, LimitPeriod period, BigDecimal notificationThreshold, 
                           Boolean isActive) {
        this.id = id;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.limitAmount = limitAmount;
        this.currentSpent = currentSpent;
        this.period = period;
        this.notificationThreshold = notificationThreshold;
        this.isActive = isActive;
        
        // Calculate derived values
        this.remainingAmount = limitAmount.subtract(currentSpent);
        if (limitAmount.compareTo(BigDecimal.ZERO) > 0) {
            this.usagePercentage = currentSpent.divide(limitAmount, 4, BigDecimal.ROUND_HALF_UP)
                                             .multiply(new BigDecimal("100"));
        } else {
            this.usagePercentage = BigDecimal.ZERO;
        }
        this.isThresholdExceeded = usagePercentage.compareTo(notificationThreshold.multiply(new BigDecimal("100"))) >= 0;
        this.isLimitExceeded = currentSpent.compareTo(limitAmount) > 0;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public BigDecimal getLimitAmount() {
        return limitAmount;
    }

    public void setLimitAmount(BigDecimal limitAmount) {
        this.limitAmount = limitAmount;
    }

    public BigDecimal getCurrentSpent() {
        return currentSpent;
    }

    public void setCurrentSpent(BigDecimal currentSpent) {
        this.currentSpent = currentSpent;
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

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    public BigDecimal getRemainingAmount() {
        return remainingAmount;
    }

    public void setRemainingAmount(BigDecimal remainingAmount) {
        this.remainingAmount = remainingAmount;
    }

    public BigDecimal getUsagePercentage() {
        return usagePercentage;
    }

    public void setUsagePercentage(BigDecimal usagePercentage) {
        this.usagePercentage = usagePercentage;
    }

    public Boolean getIsThresholdExceeded() {
        return isThresholdExceeded;
    }

    public void setIsThresholdExceeded(Boolean thresholdExceeded) {
        isThresholdExceeded = thresholdExceeded;
    }

    public Boolean getIsLimitExceeded() {
        return isLimitExceeded;
    }

    public void setIsLimitExceeded(Boolean limitExceeded) {
        isLimitExceeded = limitExceeded;
    }
}
