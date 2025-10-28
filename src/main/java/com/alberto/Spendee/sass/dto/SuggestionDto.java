package com.alberto.Spendee.sass.dto;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

public class SuggestionDto {
    private String type;            // e.g., BUDGET, SUBSCRIPTION, OVERVIEW, SPIKE
    private String title;           // Short headline
    private String message;         // Human-readable recommendation
    private String categoryName;    // Optional category context
    private Double confidence;      // 0..1
    private BigDecimal potentialMonthlySavings; // Optional
    private Map<String, Object> metrics = new HashMap<>(); // Supporting numbers

    public SuggestionDto() {
    }

    public SuggestionDto(String type, String title, String message) {
        this.type = type;
        this.title = title;
        this.message = message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public BigDecimal getPotentialMonthlySavings() {
        return potentialMonthlySavings;
    }

    public void setPotentialMonthlySavings(BigDecimal potentialMonthlySavings) {
        this.potentialMonthlySavings = potentialMonthlySavings;
    }

    public Map<String, Object> getMetrics() {
        return metrics;
    }

    public void setMetrics(Map<String, Object> metrics) {
        this.metrics = metrics;
    }
}

