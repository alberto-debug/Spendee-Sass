package com.alberto.Spendee.sass.dto;

import com.alberto.Spendee.sass.domain.transaction.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;

public class TransactionDto {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private LocalDate date;
    private BigDecimal amount;
    private String description;
    private TransactionType type;

    public TransactionDto() {
    }

    public TransactionDto(Long id, Long categoryId, String categoryName, LocalDate date,
                         BigDecimal amount, String description, TransactionType type) {
        this.id = id;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.date = date;
        this.amount = amount;
        this.description = description;
        this.type = type;
    }

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

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }
}
