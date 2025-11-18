package com.alberto.Spendee.sass.domain.spendinglimit;

import com.alberto.Spendee.sass.domain.transaction.Category;
import com.alberto.Spendee.sass.domain.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "spending_limits")
public class SpendingLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal limitAmount;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal currentSpent = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LimitPeriod period = LimitPeriod.MONTHLY;

    @Column(name = "notification_threshold", precision = 5, scale = 2)
    private BigDecimal notificationThreshold = new BigDecimal("0.80"); // 80%

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public SpendingLimit() {}

    public SpendingLimit(User user, Category category, BigDecimal limitAmount, LimitPeriod period) {
        this.user = user;
        this.category = category;
        this.limitAmount = limitAmount;
        this.period = period;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public BigDecimal getLimitAmount() {
        return limitAmount;
    }

    public void setLimitAmount(BigDecimal limitAmount) {
        this.limitAmount = limitAmount;
        this.updatedAt = LocalDateTime.now();
    }

    public BigDecimal getCurrentSpent() {
        return currentSpent;
    }

    public void setCurrentSpent(BigDecimal currentSpent) {
        this.currentSpent = currentSpent;
        this.updatedAt = LocalDateTime.now();
    }

    public LimitPeriod getPeriod() {
        return period;
    }

    public void setPeriod(LimitPeriod period) {
        this.period = period;
        this.updatedAt = LocalDateTime.now();
    }

    public BigDecimal getNotificationThreshold() {
        return notificationThreshold;
    }

    public void setNotificationThreshold(BigDecimal notificationThreshold) {
        this.notificationThreshold = notificationThreshold;
        this.updatedAt = LocalDateTime.now();
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
        this.updatedAt = LocalDateTime.now();
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Helper methods
    public BigDecimal getRemainingAmount() {
        return limitAmount.subtract(currentSpent);
    }

    public BigDecimal getUsagePercentage() {
        if (limitAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return currentSpent.divide(limitAmount, 4, BigDecimal.ROUND_HALF_UP)
                         .multiply(new BigDecimal("100"));
    }

    public boolean isThresholdExceeded() {
        return getUsagePercentage().compareTo(notificationThreshold.multiply(new BigDecimal("100"))) >= 0;
    }

    public boolean isLimitExceeded() {
        return currentSpent.compareTo(limitAmount) > 0;
    }
}
