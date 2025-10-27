package com.alberto.Spendee.sass.dto;

import java.util.List;

public class BulkCategorizeRequest {
    private List<Long> transactionIds;
    private Long categoryId;

    public BulkCategorizeRequest() {
    }

    public BulkCategorizeRequest(List<Long> transactionIds, Long categoryId) {
        this.transactionIds = transactionIds;
        this.categoryId = categoryId;
    }

    public List<Long> getTransactionIds() {
        return transactionIds;
    }

    public void setTransactionIds(List<Long> transactionIds) {
        this.transactionIds = transactionIds;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }
}
