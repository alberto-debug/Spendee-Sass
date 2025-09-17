package com.alberto.Spendee.sass.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardSummaryDto {

    private BigDecimal monthlyExpenses;
    private BigDecimal monthlyIncome;
    private BigDecimal monthlySavings;
    private Long transactionCount;
    private List<TransactionDto> recentTransactions;

    public DashboardSummaryDto() {
    }

    public DashboardSummaryDto(BigDecimal monthlyExpenses, BigDecimal monthlyIncome, 
                              BigDecimal monthlySavings, Long transactionCount,
                              List<TransactionDto> recentTransactions) {
        this.monthlyExpenses = monthlyExpenses;
        this.monthlyIncome = monthlyIncome;
        this.monthlySavings = monthlySavings;
        this.transactionCount = transactionCount;
        this.recentTransactions = recentTransactions;
    }

    public BigDecimal getMonthlyExpenses() {
        return monthlyExpenses;
    }

    public void setMonthlyExpenses(BigDecimal monthlyExpenses) {
        this.monthlyExpenses = monthlyExpenses;
    }

    public BigDecimal getMonthlyIncome() {
        return monthlyIncome;
    }

    public void setMonthlyIncome(BigDecimal monthlyIncome) {
        this.monthlyIncome = monthlyIncome;
    }

    public BigDecimal getMonthlySavings() {
        return monthlySavings;
    }

    public void setMonthlySavings(BigDecimal monthlySavings) {
        this.monthlySavings = monthlySavings;
    }

    public Long getTransactionCount() {
        return transactionCount;
    }

    public void setTransactionCount(Long transactionCount) {
        this.transactionCount = transactionCount;
    }

    public List<TransactionDto> getRecentTransactions() {
        return recentTransactions;
    }

    public void setRecentTransactions(List<TransactionDto> recentTransactions) {
        this.recentTransactions = recentTransactions;
    }
}
