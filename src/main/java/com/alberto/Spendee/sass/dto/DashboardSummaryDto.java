package com.alberto.Spendee.sass.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardSummaryDto {
    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;
    private double incomeChange;
    private double expenseChange;
    private BigDecimal monthlyIncome;
    private BigDecimal monthlyExpenses;
    private List<SpendingLimitDto> spendingLimits;

    public DashboardSummaryDto(BigDecimal totalIncome, BigDecimal totalExpenses,
                              double incomeChange, double expenseChange,
                              BigDecimal monthlyIncome, BigDecimal monthlyExpenses) {
        this.totalIncome = totalIncome != null ? totalIncome : BigDecimal.ZERO;
        this.totalExpenses = totalExpenses != null ? totalExpenses : BigDecimal.ZERO;
        this.incomeChange = incomeChange;
        this.expenseChange = expenseChange;
        this.monthlyIncome = monthlyIncome != null ? monthlyIncome : BigDecimal.ZERO;
        this.monthlyExpenses = monthlyExpenses != null ? monthlyExpenses : BigDecimal.ZERO;
    }

    // ...existing getters...

    public List<SpendingLimitDto> getSpendingLimits() {
        return spendingLimits;
    }

    public void setSpendingLimits(List<SpendingLimitDto> spendingLimits) {
        this.spendingLimits = spendingLimits;
    }

    public BigDecimal getTotalIncome() {
        return totalIncome;
    }

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public double getIncomeChange() {
        return incomeChange;
    }

    public double getExpenseChange() {
        return expenseChange;
    }

    public BigDecimal getMonthlyIncome() {
        return monthlyIncome;
    }

    public BigDecimal getMonthlyExpenses() {
        return monthlyExpenses;
    }

    public BigDecimal getTotalBalance() {
        return totalIncome.subtract(totalExpenses);
    }

    public BigDecimal getMonthlyBalance() {
        return monthlyIncome.subtract(monthlyExpenses);
    }

    public double getMonthlyChange() {
        if (monthlyIncome.compareTo(BigDecimal.ZERO) == 0 && monthlyExpenses.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return incomeChange - expenseChange;
    }
}
